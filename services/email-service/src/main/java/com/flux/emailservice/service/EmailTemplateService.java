package com.flux.emailservice.service;

import com.flux.emailservice.entity.EmailTemplate;
import com.flux.emailservice.repository.EmailTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Why: Service layer cho email template management
 * Context: Business logic cho template CRUD và processing
 */
@Service
@Transactional
public class EmailTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(EmailTemplateService.class);

    private final EmailTemplateRepository emailTemplateRepository;
    private final TemplateEngine templateEngine;

    @Autowired
    public EmailTemplateService(EmailTemplateRepository emailTemplateRepository,
                               TemplateEngine templateEngine) {
        this.emailTemplateRepository = emailTemplateRepository;
        this.templateEngine = templateEngine;
    }

    /**
     * Why: Tạo template mới
     * Context: Admin interface để tạo email templates
     */
    @CacheEvict(value = "email-templates", allEntries = true)
    public EmailTemplate createTemplate(EmailTemplate template) {
        logger.info("Creating new email template: {}", template.getTemplateName());

        // Why: Validate template name uniqueness
        if (emailTemplateRepository.existsByTemplateName(template.getTemplateName())) {
            throw new RuntimeException("Template name already exists: " + template.getTemplateName());
        }

        // Why: Validate template syntax
        validateTemplateContent(template);

        EmailTemplate savedTemplate = emailTemplateRepository.save(template);
        logger.info("Email template created with ID: {}", savedTemplate.getId());
        
        return savedTemplate;
    }

    /**
     * Why: Update existing template
     * Context: Admin interface để modify templates
     */
    @CacheEvict(value = "email-templates", key = "#template.templateName")
    public EmailTemplate updateTemplate(Long templateId, EmailTemplate template) {
        logger.info("Updating email template ID: {}", templateId);

        Optional<EmailTemplate> existingOpt = emailTemplateRepository.findById(templateId);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Template not found with ID: " + templateId);
        }

        EmailTemplate existing = existingOpt.get();

        // Why: Check if name changed và validate uniqueness
        if (!existing.getTemplateName().equals(template.getTemplateName()) &&
            emailTemplateRepository.existsByTemplateName(template.getTemplateName())) {
            throw new RuntimeException("Template name already exists: " + template.getTemplateName());
        }

        // Why: Validate new template content
        validateTemplateContent(template);

        // Why: Update fields
        existing.setTemplateName(template.getTemplateName());
        existing.setTemplateType(template.getTemplateType());
        existing.setSubjectTemplate(template.getSubjectTemplate());
        existing.setHtmlContent(template.getHtmlContent());
        existing.setTextContent(template.getTextContent());
        existing.setIsActive(template.getIsActive());

        EmailTemplate updatedTemplate = emailTemplateRepository.save(existing);
        logger.info("Email template updated: {}", updatedTemplate.getTemplateName());
        
        return updatedTemplate;
    }

    /**
     * Why: Get template by ID
     * Context: Admin interface và API endpoints
     */
    @Transactional(readOnly = true)
    public Optional<EmailTemplate> getTemplateById(Long templateId) {
        return emailTemplateRepository.findById(templateId);
    }

    /**
     * Why: Get active template by name với caching
     * Context: Email processing performance optimization
     */
    @Cacheable(value = "email-templates", key = "#templateName")
    @Transactional(readOnly = true)
    public Optional<EmailTemplate> getActiveTemplateByName(String templateName) {
        logger.debug("Loading template: {}", templateName);
        return emailTemplateRepository.findByTemplateNameAndIsActiveTrue(templateName);
    }

    /**
     * Why: Get all templates với filtering
     * Context: Admin interface với search functionality
     */
    @Transactional(readOnly = true)
    public Page<EmailTemplate> getTemplates(String templateType, Boolean isActive, Pageable pageable) {
        List<EmailTemplate> templates = emailTemplateRepository.findTemplatesWithFilters(templateType, isActive);
        
        // Why: Manual pagination vì custom query
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), templates.size());
        
        List<EmailTemplate> pageContent = templates.subList(start, end);
        return new PageImpl<>(pageContent, pageable, templates.size());
    }

    /**
     * Why: Get all active templates
     * Context: Template selection dropdown
     */
    @Transactional(readOnly = true)
    public List<EmailTemplate> getAllActiveTemplates() {
        return emailTemplateRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    /**
     * Why: Delete template (soft delete by deactivating)
     * Context: Admin action - prefer deactivation over deletion
     */
    @CacheEvict(value = "email-templates", key = "#templateId")
    public boolean deactivateTemplate(Long templateId) {
        Optional<EmailTemplate> templateOpt = emailTemplateRepository.findById(templateId);
        if (templateOpt.isPresent()) {
            EmailTemplate template = templateOpt.get();
            template.setIsActive(false);
            emailTemplateRepository.save(template);
            
            logger.info("Template deactivated: {}", template.getTemplateName());
            return true;
        }
        
        return false;
    }

    /**
     * Why: Activate template
     * Context: Admin action để re-enable template
     */
    @CacheEvict(value = "email-templates", key = "#templateId")
    public boolean activateTemplate(Long templateId) {
        Optional<EmailTemplate> templateOpt = emailTemplateRepository.findById(templateId);
        if (templateOpt.isPresent()) {
            EmailTemplate template = templateOpt.get();
            template.setIsActive(true);
            emailTemplateRepository.save(template);
            
            logger.info("Template activated: {}", template.getTemplateName());
            return true;
        }
        
        return false;
    }

    /**
     * Why: Process template với variables
     * Context: Generate actual email content từ template
     */
    public ProcessedTemplate processTemplate(String templateName, Map<String, Object> variables) {
        logger.debug("Processing template: {} with {} variables", templateName, variables.size());

        Optional<EmailTemplate> templateOpt = getActiveTemplateByName(templateName);
        if (templateOpt.isEmpty()) {
            throw new RuntimeException("Template not found or inactive: " + templateName);
        }

        EmailTemplate template = templateOpt.get();

        try {
            // Why: Create Thymeleaf context với variables
            Context context = new Context();
            context.setVariables(variables);

            // Why: Process subject template
            String processedSubject = templateEngine.process(template.getSubjectTemplate(), context);

            // Why: Process HTML content
            String processedHtml = templateEngine.process(template.getHtmlContent(), context);

            // Why: Process text content (fallback)
            String processedText = null;
            if (template.getTextContent() != null && !template.getTextContent().isEmpty()) {
                processedText = templateEngine.process(template.getTextContent(), context);
            }

            ProcessedTemplate result = new ProcessedTemplate(
                processedSubject,
                processedHtml,
                processedText,
                template.getTemplateName(),
                template.getTemplateType()
            );

            logger.debug("Template processed successfully: {}", templateName);
            return result;

        } catch (Exception e) {
            logger.error("Error processing template {}: {}", templateName, e.getMessage(), e);
            throw new RuntimeException("Failed to process template: " + templateName, e);
        }
    }

    /**
     * Why: Preview template với sample data
     * Context: Admin interface để test templates
     */
    public ProcessedTemplate previewTemplate(Long templateId, Map<String, Object> sampleVariables) {
        Optional<EmailTemplate> templateOpt = emailTemplateRepository.findById(templateId);
        if (templateOpt.isEmpty()) {
            throw new RuntimeException("Template not found with ID: " + templateId);
        }

        EmailTemplate template = templateOpt.get();
        
        // Why: Use template name cho processing
        return processTemplate(template.getTemplateName(), sampleVariables);
    }

    /**
     * Why: Validate template content syntax
     * Context: Prevent invalid templates from being saved
     */
    private void validateTemplateContent(EmailTemplate template) {
        try {
            // Why: Test template compilation với empty context
            Context testContext = new Context();
            testContext.setVariable("testVar", "test");

            // Why: Validate subject template
            templateEngine.process(template.getSubjectTemplate(), testContext);

            // Why: Validate HTML content
            templateEngine.process(template.getHtmlContent(), testContext);

            // Why: Validate text content if present
            if (template.getTextContent() != null && !template.getTextContent().isEmpty()) {
                templateEngine.process(template.getTextContent(), testContext);
            }

            logger.debug("Template validation passed for: {}", template.getTemplateName());

        } catch (Exception e) {
            logger.error("Template validation failed for {}: {}", template.getTemplateName(), e.getMessage());
            throw new RuntimeException("Invalid template syntax: " + e.getMessage(), e);
        }
    }

    /**
     * Why: Get template statistics
     * Context: Admin dashboard metrics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTemplateStatistics() {
        List<Object[]> templatesByType = emailTemplateRepository.countTemplatesByType();
        long totalTemplates = emailTemplateRepository.count();
        long activeTemplates = emailTemplateRepository.findByIsActiveTrueOrderByCreatedAtDesc().size();

        return Map.of(
            "totalTemplates", totalTemplates,
            "activeTemplates", activeTemplates,
            "templatesByType", templatesByType
        );
    }

    /**
     * Why: DTO cho processed template result
     * Context: Return structure cho template processing
     */
    public static class ProcessedTemplate {
        private final String subject;
        private final String htmlContent;
        private final String textContent;
        private final String templateName;
        private final String templateType;

        public ProcessedTemplate(String subject, String htmlContent, String textContent,
                               String templateName, String templateType) {
            this.subject = subject;
            this.htmlContent = htmlContent;
            this.textContent = textContent;
            this.templateName = templateName;
            this.templateType = templateType;
        }

        // Getters
        public String getSubject() { return subject; }
        public String getHtmlContent() { return htmlContent; }
        public String getTextContent() { return textContent; }
        public String getTemplateName() { return templateName; }
        public String getTemplateType() { return templateType; }
    }
}
