package com.flux.emailservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Why: JPA entity cho email delivery logging
 * Context: Track chi tiết delivery status và metrics
 */
@Entity
@Table(name = "email_logs",
       indexes = {
           @Index(name = "idx_email_log_queue", columnList = "email_queue_id"),
           @Index(name = "idx_email_log_recipient", columnList = "recipient_email"),
           @Index(name = "idx_email_log_status", columnList = "status"),
           @Index(name = "idx_email_log_sent_at", columnList = "sent_at")
       })
@EntityListeners(AuditingEntityListener.class)
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Email queue reference is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_queue_id", nullable = false)
    private EmailQueue emailQueue;

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    @Size(max = 320, message = "Email must not exceed 320 characters")
    @Column(name = "recipient_email", nullable = false, length = 320)
    private String recipientEmail;

    @Size(max = 500, message = "Subject must not exceed 500 characters")
    @Column(name = "subject", length = 500)
    private String subject;

    @NotBlank(message = "Status is required")
    @Size(max = 20, message = "Status must not exceed 20 characters")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Size(max = 255, message = "Provider message ID must not exceed 255 characters")
    @Column(name = "provider_message_id", length = 255)
    private String providerMessageId;

    // Why: JSON column để store detailed delivery information
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "delivery_status", columnDefinition = "jsonb")
    private Map<String, Object> deliveryStatus;

    @NotNull(message = "Sent at is required")
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "clicked_at")
    private LocalDateTime clickedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public EmailLog() {}

    public EmailLog(EmailQueue emailQueue, String recipientEmail, String subject, String status) {
        this.emailQueue = emailQueue;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.status = status;
        this.sentAt = LocalDateTime.now();
    }

    // Business methods
    public void markAsDelivered() {
        this.status = EmailLogStatus.DELIVERED.name();
        this.deliveredAt = LocalDateTime.now();
    }

    public void markAsOpened() {
        this.openedAt = LocalDateTime.now();
    }

    public void markAsClicked() {
        this.clickedAt = LocalDateTime.now();
    }

    public void markAsBounced() {
        this.status = EmailLogStatus.BOUNCED.name();
    }

    public boolean isDelivered() {
        return EmailLogStatus.DELIVERED.name().equals(this.status);
    }

    public boolean isOpened() {
        return this.openedAt != null;
    }

    public boolean isClicked() {
        return this.clickedAt != null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EmailQueue getEmailQueue() {
        return emailQueue;
    }

    public void setEmailQueue(EmailQueue emailQueue) {
        this.emailQueue = emailQueue;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public void setProviderMessageId(String providerMessageId) {
        this.providerMessageId = providerMessageId;
    }

    public Map<String, Object> getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(Map<String, Object> deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getOpenedAt() {
        return openedAt;
    }

    public void setOpenedAt(LocalDateTime openedAt) {
        this.openedAt = openedAt;
    }

    public LocalDateTime getClickedAt() {
        return clickedAt;
    }

    public void setClickedAt(LocalDateTime clickedAt) {
        this.clickedAt = clickedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "EmailLog{" +
                "id=" + id +
                ", recipientEmail='" + recipientEmail + '\'' +
                ", status='" + status + '\'' +
                ", sentAt=" + sentAt +
                ", deliveredAt=" + deliveredAt +
                '}';
    }

    /**
     * Why: Enum cho email log status
     * Context: Type-safe status values cho delivery tracking
     */
    public enum EmailLogStatus {
        SENT,
        DELIVERED,
        BOUNCED,
        FAILED,
        OPENED,
        CLICKED
    }
}
