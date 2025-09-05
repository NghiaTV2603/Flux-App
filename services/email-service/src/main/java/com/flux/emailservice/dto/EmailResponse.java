package com.flux.emailservice.dto;

import java.time.LocalDateTime;

/**
 * Why: DTO cho API responses
 * Context: Response structure cho REST endpoints
 */
public class EmailResponse {

    private Long id;
    private String recipientEmail;
    private String recipientName;
    private String templateName;
    private String status;
    private Integer priority;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private Integer retryCount;
    private String errorMessage;
    private LocalDateTime createdAt;

    // Constructors
    public EmailResponse() {}

    public EmailResponse(Long id, String recipientEmail, String recipientName, String templateName,
                        String status, Integer priority, LocalDateTime scheduledAt, 
                        LocalDateTime sentAt, Integer retryCount, LocalDateTime createdAt) {
        this.id = id;
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.templateName = templateName;
        this.status = status;
        this.priority = priority;
        this.scheduledAt = scheduledAt;
        this.sentAt = sentAt;
        this.retryCount = retryCount;
        this.createdAt = createdAt;
    }

    // Static factory methods
    public static EmailResponse success(Long id, String recipientEmail, String status) {
        EmailResponse response = new EmailResponse();
        response.setId(id);
        response.setRecipientEmail(recipientEmail);
        response.setStatus(status);
        response.setCreatedAt(LocalDateTime.now());
        return response;
    }

    public static EmailResponse error(String recipientEmail, String errorMessage) {
        EmailResponse response = new EmailResponse();
        response.setRecipientEmail(recipientEmail);
        response.setStatus("FAILED");
        response.setErrorMessage(errorMessage);
        response.setCreatedAt(LocalDateTime.now());
        return response;
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

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
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

    @Override
    public String toString() {
        return "EmailResponse{" +
                "id=" + id +
                ", recipientEmail='" + recipientEmail + '\'' +
                ", status='" + status + '\'' +
                ", priority=" + priority +
                ", createdAt=" + createdAt +
                '}';
    }
}
