package com.flux.emailservice.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Why: DTO cho events nhận từ RabbitMQ
 * Context: Cấu trúc chuẩn cho all events trong hệ thống
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class EmailEvent {

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("eventId")
    private String eventId;

    @JsonProperty("timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    @JsonProperty("version")
    private String version;

    @JsonProperty("data")
    private Map<String, Object> data;

    // Constructors
    public EmailEvent() {}

    public EmailEvent(String eventType, String eventId, LocalDateTime timestamp, 
                     String version, Map<String, Object> data) {
        this.eventType = eventType;
        this.eventId = eventId;
        this.timestamp = timestamp;
        this.version = version;
        this.data = data;
    }

    // Business methods
    public boolean isUserCreatedEvent() {
        return "user.created".equals(this.eventType);
    }

    public boolean isServerMemberInvitedEvent() {
        return "server.member.invited".equals(this.eventType);
    }

    public boolean isServerMemberJoinedEvent() {
        return "server.member.joined".equals(this.eventType);
    }

    public boolean isPasswordResetEvent() {
        return "user.password.reset.requested".equals(this.eventType);
    }

    public boolean isServerCreatedEvent() {
        return "server.created".equals(this.eventType);
    }

    // Helper methods để extract common data
    public String getUserId() {
        return data != null ? (String) data.get("userId") : null;
    }

    public String getUserEmail() {
        return data != null ? (String) data.get("userEmail") : null;
    }

    public String getUserName() {
        return data != null ? (String) data.get("userName") : null;
    }

    public String getServerId() {
        return data != null ? (String) data.get("serverId") : null;
    }

    public String getServerName() {
        return data != null ? (String) data.get("serverName") : null;
    }

    public String getInviterName() {
        return data != null ? (String) data.get("inviterName") : null;
    }

    public String getInviteUrl() {
        return data != null ? (String) data.get("inviteUrl") : null;
    }

    public String getResetToken() {
        return data != null ? (String) data.get("resetToken") : null;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getAdditionalData() {
        if (data != null && data.containsKey("additionalData")) {
            return (Map<String, Object>) data.get("additionalData");
        }
        return Map.of();
    }

    // Getters and Setters
    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "EmailEvent{" +
                "eventType='" + eventType + '\'' +
                ", eventId='" + eventId + '\'' +
                ", timestamp=" + timestamp +
                ", version='" + version + '\'' +
                ", userEmail='" + getUserEmail() + '\'' +
                '}';
    }

    /**
     * Why: Constants cho event types
     * Context: Type-safe event type references
     */
    public static class EventTypes {
        public static final String USER_CREATED = "user.created";
        public static final String SERVER_MEMBER_INVITED = "server.member.invited";
        public static final String SERVER_MEMBER_JOINED = "server.member.joined";
        public static final String PASSWORD_RESET_REQUESTED = "user.password.reset.requested";
        public static final String SERVER_CREATED = "server.created";
    }
}
