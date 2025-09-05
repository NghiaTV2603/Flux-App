package com.flux.emailservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Why: DTO cho email sending requests
 * Context: Request body cho REST API endpoints
 */
public class EmailRequest {

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    @Size(max = 320, message = "Email must not exceed 320 characters")
    private String recipientEmail;

    @Size(max = 255, message = "Recipient name must not exceed 255 characters")
    private String recipientName;

    @NotBlank(message = "Template name is required")
    @Size(max = 100, message = "Template name must not exceed 100 characters")
    private String templateName;

    private Map<String, Object> templateVariables;

    private Integer priority = 3; // Default medium priority

    private LocalDateTime scheduledAt;

    // Constructors
    public EmailRequest() {}

    public EmailRequest(String recipientEmail, String recipientName, String templateName,
                       Map<String, Object> templateVariables, Integer priority) {
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.templateName = templateName;
        this.templateVariables = templateVariables;
        this.priority = priority;
    }

    // Getters and Setters
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

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    @Override
    public String toString() {
        return "EmailRequest{" +
                "recipientEmail='" + recipientEmail + '\'' +
                ", recipientName='" + recipientName + '\'' +
                ", templateName='" + templateName + '\'' +
                ", priority=" + priority +
                ", scheduledAt=" + scheduledAt +
                '}';
    }
}
