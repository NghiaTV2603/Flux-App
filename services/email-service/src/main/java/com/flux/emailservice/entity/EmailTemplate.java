package com.flux.emailservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Why: JPA entity cho email templates
 * Context: Lưu trữ các template email có thể tái sử dụng
 */
@Entity
@Table(name = "email_templates", 
       uniqueConstraints = @UniqueConstraint(columnNames = "template_name"))
@EntityListeners(AuditingEntityListener.class)
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Template name is required")
    @Size(max = 100, message = "Template name must not exceed 100 characters")
    @Column(name = "template_name", nullable = false, unique = true, length = 100)
    private String templateName;

    @NotBlank(message = "Template type is required")
    @Size(max = 50, message = "Template type must not exceed 50 characters")
    @Column(name = "template_type", nullable = false, length = 50)
    private String templateType;

    @NotBlank(message = "Subject template is required")
    @Size(max = 500, message = "Subject template must not exceed 500 characters")
    @Column(name = "subject_template", nullable = false, length = 500)
    private String subjectTemplate;

    @NotBlank(message = "HTML content is required")
    @Column(name = "html_content", nullable = false, columnDefinition = "TEXT")
    private String htmlContent;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @NotNull(message = "Active status is required")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Size(max = 100, message = "Created by must not exceed 100 characters")
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public EmailTemplate() {}

    public EmailTemplate(String templateName, String templateType, String subjectTemplate, 
                        String htmlContent, String textContent, String createdBy) {
        this.templateName = templateName;
        this.templateType = templateType;
        this.subjectTemplate = subjectTemplate;
        this.htmlContent = htmlContent;
        this.textContent = textContent;
        this.createdBy = createdBy;
        this.isActive = true;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public String getSubjectTemplate() {
        return subjectTemplate;
    }

    public void setSubjectTemplate(String subjectTemplate) {
        this.subjectTemplate = subjectTemplate;
    }

    public String getHtmlContent() {
        return htmlContent;
    }

    public void setHtmlContent(String htmlContent) {
        this.htmlContent = htmlContent;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "EmailTemplate{" +
                "id=" + id +
                ", templateName='" + templateName + '\'' +
                ", templateType='" + templateType + '\'' +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                '}';
    }
}
