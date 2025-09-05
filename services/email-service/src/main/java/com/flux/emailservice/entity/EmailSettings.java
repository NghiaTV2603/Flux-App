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
 * Why: JPA entity cho email service settings
 * Context: Dynamic configuration cho email service
 */
@Entity
@Table(name = "email_settings",
       uniqueConstraints = @UniqueConstraint(columnNames = "setting_key"))
@EntityListeners(AuditingEntityListener.class)
public class EmailSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Setting key is required")
    @Size(max = 100, message = "Setting key must not exceed 100 characters")
    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Column(name = "description", length = 500)
    private String description;

    @NotNull(message = "Active status is required")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public EmailSettings() {}

    public EmailSettings(String settingKey, String settingValue, String description) {
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.description = description;
        this.isActive = true;
    }

    // Business methods
    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public boolean isEnabled() {
        return Boolean.TRUE.equals(this.isActive);
    }

    // Helper methods cho common settings
    public Integer getIntValue() {
        try {
            return this.settingValue != null ? Integer.parseInt(this.settingValue) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public Boolean getBooleanValue() {
        return this.settingValue != null ? Boolean.parseBoolean(this.settingValue) : null;
    }

    public Double getDoubleValue() {
        try {
            return this.settingValue != null ? Double.parseDouble(this.settingValue) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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
        return "EmailSettings{" +
                "id=" + id +
                ", settingKey='" + settingKey + '\'' +
                ", settingValue='" + settingValue + '\'' +
                ", isActive=" + isActive +
                '}';
    }

    /**
     * Why: Constants cho common setting keys
     * Context: Type-safe setting key references
     */
    public static class SettingKeys {
        public static final String SMTP_HOST = "smtp.host";
        public static final String SMTP_PORT = "smtp.port";
        public static final String FROM_EMAIL = "email.from.address";
        public static final String FROM_NAME = "email.from.name";
        public static final String RATE_LIMIT_HOUR = "rate.limit.hour";
        public static final String RATE_LIMIT_DAY = "rate.limit.day";
        public static final String RETRY_MAX_ATTEMPTS = "retry.max.attempts";
        public static final String BATCH_SIZE = "processing.batch.size";
        public static final String ENABLE_TRACKING = "tracking.enabled";
        public static final String BLACKLIST_DOMAINS = "security.blacklist.domains";
        public static final String WHITELIST_ENABLED = "security.whitelist.enabled";
    }
}
