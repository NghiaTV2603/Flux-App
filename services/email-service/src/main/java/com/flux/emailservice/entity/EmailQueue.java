package com.flux.emailservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Why: JPA entity cho email queue system
 * Context: Lưu trữ emails cần gửi với priority và retry mechanism
 */
@Entity
@Table(name = "email_queue", 
       indexes = {
           @Index(name = "idx_email_queue_status", columnList = "status"),
           @Index(name = "idx_email_queue_scheduled", columnList = "scheduled_at"),
           @Index(name = "idx_email_queue_recipient", columnList = "recipient_email")
       })
@EntityListeners(AuditingEntityListener.class)
public class EmailQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    @Size(max = 320, message = "Email must not exceed 320 characters")
    @Column(name = "recipient_email", nullable = false, length = 320)
    private String recipientEmail;

    @Size(max = 255, message = "Recipient name must not exceed 255 characters")
    @Column(name = "recipient_name", length = 255)
    private String recipientName;

    @NotNull(message = "Template is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private EmailTemplate template;

    // Why: JSON column để store template variables dynamically
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "template_variables", columnDefinition = "jsonb")
    private Map<String, Object> templateVariables;

    @NotNull(message = "Priority is required")
    @Column(name = "priority", nullable = false)
    private Integer priority = 3; // Default priority: 3 (medium)

    @NotBlank(message = "Status is required")
    @Size(max = 20, message = "Status must not exceed 20 characters")
    @Column(name = "status", nullable = false, length = 20)
    private String status = EmailQueueStatus.PENDING.name();

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    private Integer maxRetries = 3;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public EmailQueue() {}

    public EmailQueue(String recipientEmail, String recipientName, EmailTemplate template,
                     Map<String, Object> templateVariables, Integer priority) {
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.template = template;
        this.templateVariables = templateVariables;
        this.priority = priority;
        this.scheduledAt = LocalDateTime.now();
    }

    // Business methods
    public void markAsSent() {
        this.status = EmailQueueStatus.SENT.name();
        this.sentAt = LocalDateTime.now();
    }

    public void markAsFailed(String errorMessage) {
        this.status = EmailQueueStatus.FAILED.name();
        this.errorMessage = errorMessage;
    }

    public void markAsProcessing() {
        this.status = EmailQueueStatus.PROCESSING.name();
    }

    public void incrementRetryCount() {
        this.retryCount++;
    }

    public boolean canRetry() {
        return this.retryCount < this.maxRetries;
    }

    public boolean isHighPriority() {
        return this.priority <= 2;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public EmailTemplate getTemplate() {
        return template;
    }

    public void setTemplate(EmailTemplate template) {
        this.template = template;
    }

    public Map<String, Object> getTemplateVariables() {
        return templateVariables;
    }

    public void setTemplateVariables(Map<String, Object> templateVariables) {
        this.templateVariables = templateVariables;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public Integer getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(Integer maxRetries) {
        this.maxRetries = maxRetries;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
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
        return "EmailQueue{" +
                "id=" + id +
                ", recipientEmail='" + recipientEmail + '\'' +
                ", status='" + status + '\'' +
                ", priority=" + priority +
                ", retryCount=" + retryCount +
                ", scheduledAt=" + scheduledAt +
                '}';
    }

    /**
     * Why: Enum cho email queue status
     * Context: Type-safe status values
     */
    public enum EmailQueueStatus {
        PENDING,
        PROCESSING,
        SENT,
        FAILED,
        CANCELLED
    }
}
