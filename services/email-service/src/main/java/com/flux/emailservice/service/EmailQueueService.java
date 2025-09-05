package com.flux.emailservice.service;

import com.flux.emailservice.config.ApplicationProperties;
import com.flux.emailservice.entity.EmailQueue;
import com.flux.emailservice.entity.EmailTemplate;
import com.flux.emailservice.repository.EmailQueueRepository;
import com.flux.emailservice.repository.EmailTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Why: Service layer cho email queue management
 * Context: Business logic cho email queuing, processing và tracking
 */
@Service
@Transactional
public class EmailQueueService {

    private static final Logger logger = LoggerFactory.getLogger(EmailQueueService.class);

    private final EmailQueueRepository emailQueueRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final ApplicationProperties applicationProperties;
    private final RateLimitService rateLimitService;

    @Autowired
    public EmailQueueService(EmailQueueRepository emailQueueRepository,
                           EmailTemplateRepository emailTemplateRepository,
                           ApplicationProperties applicationProperties,
                           RateLimitService rateLimitService) {
        this.emailQueueRepository = emailQueueRepository;
        this.emailTemplateRepository = emailTemplateRepository;
        this.applicationProperties = applicationProperties;
        this.rateLimitService = rateLimitService;
    }

    /**
     * Why: Queue email với template name
     * Context: Được gọi từ EmailEventListener khi nhận events
     */
    public EmailQueue queueEmail(String recipientEmail, String recipientName, 
                               String templateName, Map<String, Object> templateVariables, 
                               Integer priority) {
        
        logger.info("Queueing email to {} with template {}", recipientEmail, templateName);

        // Why: Validate rate limit trước khi queue
        if (!rateLimitService.isAllowed(recipientEmail)) {
            logger.warn("Rate limit exceeded for email: {}", recipientEmail);
            throw new RuntimeException("Rate limit exceeded for recipient: " + recipientEmail);
        }

        // Why: Tìm template theo name
        Optional<EmailTemplate> templateOpt = emailTemplateRepository
                .findByTemplateNameAndIsActiveTrue(templateName);
        
        if (templateOpt.isEmpty()) {
            logger.error("Template not found: {}", templateName);
            throw new RuntimeException("Email template not found: " + templateName);
        }

        EmailTemplate template = templateOpt.get();
        
        // Why: Tạo email queue entry
        EmailQueue emailQueue = new EmailQueue(
                recipientEmail,
                recipientName,
                template,
                templateVariables,
                priority != null ? priority : 3
        );

        // Why: Set scheduled time (immediate by default)
        emailQueue.setScheduledAt(LocalDateTime.now());
        emailQueue.setMaxRetries(applicationProperties.getRetry().getMaxAttempts());

        EmailQueue savedQueue = emailQueueRepository.save(emailQueue);
        
        logger.info("Email queued successfully with ID: {}", savedQueue.getId());
        return savedQueue;
    }

    /**
     * Why: Queue email với scheduled time
     * Context: Scheduled email sending
     */
    public EmailQueue queueScheduledEmail(String recipientEmail, String recipientName,
                                        String templateName, Map<String, Object> templateVariables,
                                        Integer priority, LocalDateTime scheduledAt) {
        
        logger.info("Scheduling email to {} for {}", recipientEmail, scheduledAt);

        EmailQueue emailQueue = queueEmail(recipientEmail, recipientName, templateName, 
                                         templateVariables, priority);
        
        emailQueue.setScheduledAt(scheduledAt);
        return emailQueueRepository.save(emailQueue);
    }

    /**
     * Why: Lấy emails cần gửi
     * Context: Email processing job
     */
    @Transactional(readOnly = true)
    public List<EmailQueue> getEmailsToSend(int batchSize) {
        LocalDateTime currentTime = LocalDateTime.now();
        Pageable pageable = PageRequest.of(0, batchSize);
        
        List<EmailQueue> emails = emailQueueRepository.findEmailsToSend(currentTime, pageable);
        
        logger.debug("Found {} emails to send", emails.size());
        return emails;
    }

    /**
     * Why: Lấy high priority emails
     * Context: Priority processing
     */
    @Transactional(readOnly = true)
    public List<EmailQueue> getHighPriorityEmails(int batchSize) {
        LocalDateTime currentTime = LocalDateTime.now();
        Pageable pageable = PageRequest.of(0, batchSize);
        
        List<EmailQueue> emails = emailQueueRepository.findHighPriorityEmails(currentTime, pageable);
        
        logger.debug("Found {} high priority emails", emails.size());
        return emails;
    }

    /**
     * Why: Mark emails as processing
     * Context: Prevent duplicate processing
     */
    public void markEmailsAsProcessing(List<Long> emailIds) {
        if (!emailIds.isEmpty()) {
            int updated = emailQueueRepository.markEmailsAsProcessing(emailIds, LocalDateTime.now());
            logger.debug("Marked {} emails as processing", updated);
        }
    }

    /**
     * Why: Mark email as sent
     * Context: Update status after successful sending
     */
    public void markEmailAsSent(Long emailId) {
        Optional<EmailQueue> emailOpt = emailQueueRepository.findById(emailId);
        if (emailOpt.isPresent()) {
            EmailQueue email = emailOpt.get();
            email.markAsSent();
            emailQueueRepository.save(email);
            
            logger.info("Email {} marked as sent", emailId);
        }
    }

    /**
     * Why: Mark email as failed
     * Context: Update status after failed sending
     */
    public void markEmailAsFailed(Long emailId, String errorMessage) {
        Optional<EmailQueue> emailOpt = emailQueueRepository.findById(emailId);
        if (emailOpt.isPresent()) {
            EmailQueue email = emailOpt.get();
            email.incrementRetryCount();
            
            if (email.canRetry()) {
                // Why: Reset to PENDING cho retry
                email.setStatus(EmailQueue.EmailQueueStatus.PENDING.name());
                email.setScheduledAt(calculateNextRetryTime(email.getRetryCount()));
                logger.info("Email {} scheduled for retry #{}", emailId, email.getRetryCount());
            } else {
                // Why: Max retries reached
                email.markAsFailed(errorMessage);
                logger.warn("Email {} failed permanently: {}", emailId, errorMessage);
            }
            
            emailQueueRepository.save(email);
        }
    }

    /**
     * Why: Calculate next retry time với exponential backoff
     * Context: Retry mechanism
     */
    private LocalDateTime calculateNextRetryTime(int retryCount) {
        long delayMs = applicationProperties.getRetry().getDelayMs();
        double multiplier = applicationProperties.getRetry().getBackoffMultiplier();
        
        long nextDelayMs = (long) (delayMs * Math.pow(multiplier, retryCount - 1));
        
        return LocalDateTime.now().plusSeconds(nextDelayMs / 1000);
    }

    /**
     * Why: Lấy emails for retry
     * Context: Retry processing job
     */
    @Transactional(readOnly = true)
    public List<EmailQueue> getEmailsForRetry(int batchSize) {
        Pageable pageable = PageRequest.of(0, batchSize);
        List<EmailQueue> emails = emailQueueRepository.findEmailsForRetry(pageable);
        
        logger.debug("Found {} emails for retry", emails.size());
        return emails;
    }

    /**
     * Why: Get email queue với pagination
     * Context: Admin interface
     */
    @Transactional(readOnly = true)
    public Page<EmailQueue> getEmailQueue(String status, Pageable pageable) {
        if (status != null && !status.isEmpty()) {
            return emailQueueRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            return emailQueueRepository.findAll(pageable);
        }
    }

    /**
     * Why: Get email by ID
     * Context: API endpoint
     */
    @Transactional(readOnly = true)
    public Optional<EmailQueue> getEmailById(Long id) {
        return emailQueueRepository.findById(id);
    }

    /**
     * Why: Cancel email
     * Context: Admin action
     */
    public boolean cancelEmail(Long emailId) {
        Optional<EmailQueue> emailOpt = emailQueueRepository.findById(emailId);
        if (emailOpt.isPresent()) {
            EmailQueue email = emailOpt.get();
            
            // Why: Chỉ cancel được emails chưa gửi
            if (EmailQueue.EmailQueueStatus.PENDING.name().equals(email.getStatus())) {
                email.setStatus(EmailQueue.EmailQueueStatus.CANCELLED.name());
                emailQueueRepository.save(email);
                
                logger.info("Email {} cancelled", emailId);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Why: Retry specific email
     * Context: Admin manual retry
     */
    public boolean retryEmail(Long emailId) {
        Optional<EmailQueue> emailOpt = emailQueueRepository.findById(emailId);
        if (emailOpt.isPresent()) {
            EmailQueue email = emailOpt.get();
            
            if (email.canRetry()) {
                email.setStatus(EmailQueue.EmailQueueStatus.PENDING.name());
                email.setScheduledAt(LocalDateTime.now());
                email.setErrorMessage(null);
                emailQueueRepository.save(email);
                
                logger.info("Email {} manually retried", emailId);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Why: Get email statistics
     * Context: Dashboard metrics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getEmailStatistics() {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(30);
        
        Object stats = emailQueueRepository.getEmailStatsSince(fromDate);
        List<Object[]> statusCounts = emailQueueRepository.countEmailsByStatus();
        List<Object[]> priorityCounts = emailQueueRepository.countPendingEmailsByPriority();
        
        return Map.of(
            "monthlyStats", stats,
            "statusCounts", statusCounts,
            "priorityCounts", priorityCounts,
            "totalEmails", emailQueueRepository.count()
        );
    }

    /**
     * Why: Clean up old processed emails
     * Context: Data retention job
     */
    public int cleanupOldEmails(int daysToKeep, int batchSize) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        Pageable pageable = PageRequest.of(0, batchSize);
        
        List<EmailQueue> oldEmails = emailQueueRepository.findOldProcessedEmails(cutoffDate, pageable);
        
        if (!oldEmails.isEmpty()) {
            emailQueueRepository.deleteAll(oldEmails);
            logger.info("Cleaned up {} old emails", oldEmails.size());
        }
        
        return oldEmails.size();
    }
}
