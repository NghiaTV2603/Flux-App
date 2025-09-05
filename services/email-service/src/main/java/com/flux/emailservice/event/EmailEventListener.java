package com.flux.emailservice.event;

import com.flux.emailservice.service.EmailQueueService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Why: Event listener để xử lý RabbitMQ messages
 * Context: Lắng nghe events từ các service khác và tạo email jobs
 */
@Component
public class EmailEventListener {

    private static final Logger logger = LoggerFactory.getLogger(EmailEventListener.class);

    private final EmailQueueService emailQueueService;

    @Autowired
    public EmailEventListener(EmailQueueService emailQueueService) {
        this.emailQueueService = emailQueueService;
    }

    /**
     * Why: Lắng nghe tất cả email events từ single queue
     * Context: Single listener để centralized event processing
     */
    @RabbitListener(queues = "#{@rabbitMQConfig.EMAIL_QUEUE}")
    public void handleEmailEvent(EmailEvent event) {
        logger.info("Received email event: {}", event);

        try {
            switch (event.getEventType()) {
                case EmailEvent.EventTypes.USER_CREATED:
                    handleUserCreatedEvent(event);
                    break;
                    
                case EmailEvent.EventTypes.SERVER_MEMBER_INVITED:
                    handleServerMemberInvitedEvent(event);
                    break;
                    
                case EmailEvent.EventTypes.SERVER_MEMBER_JOINED:
                    handleServerMemberJoinedEvent(event);
                    break;
                    
                case EmailEvent.EventTypes.PASSWORD_RESET_REQUESTED:
                    handlePasswordResetEvent(event);
                    break;
                    
                case EmailEvent.EventTypes.SERVER_CREATED:
                    handleServerCreatedEvent(event);
                    break;
                    
                default:
                    logger.warn("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            logger.error("Error processing email event: {}", event, e);
            // Why: Rethrow để trigger retry mechanism
            throw new RuntimeException("Failed to process email event", e);
        }
    }

    /**
     * Why: Xử lý user registration event
     * Context: Gửi welcome email cho user mới
     */
    private void handleUserCreatedEvent(EmailEvent event) {
        logger.info("Processing user created event for user: {}", event.getUserEmail());

        if (event.getUserEmail() == null || event.getUserName() == null) {
            logger.warn("Missing required user data in event: {}", event);
            return;
        }

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("userName", event.getUserName());
        templateVariables.put("userEmail", event.getUserEmail());
        templateVariables.put("loginUrl", "https://flux.com/login");
        templateVariables.put("supportEmail", "support@flux.com");
        templateVariables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));

        // Why: Merge additional data từ event
        templateVariables.putAll(event.getAdditionalData());

        emailQueueService.queueEmail(
            event.getUserEmail(),
            event.getUserName(),
            "WELCOME_EMAIL",
            templateVariables,
            3 // Medium priority
        );

        logger.info("Queued welcome email for user: {}", event.getUserEmail());
    }

    /**
     * Why: Xử lý server invitation event
     * Context: Gửi invitation email khi user được mời vào server
     */
    private void handleServerMemberInvitedEvent(EmailEvent event) {
        logger.info("Processing server member invited event for user: {}", event.getUserEmail());

        if (event.getUserEmail() == null || event.getServerName() == null) {
            logger.warn("Missing required invitation data in event: {}", event);
            return;
        }

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("userName", event.getUserName());
        templateVariables.put("userEmail", event.getUserEmail());
        templateVariables.put("serverName", event.getServerName());
        templateVariables.put("inviterName", event.getInviterName());
        templateVariables.put("inviteUrl", event.getInviteUrl());
        templateVariables.put("supportEmail", "support@flux.com");
        templateVariables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));

        templateVariables.putAll(event.getAdditionalData());

        emailQueueService.queueEmail(
            event.getUserEmail(),
            event.getUserName(),
            "SERVER_INVITATION",
            templateVariables,
            2 // High priority
        );

        logger.info("Queued invitation email for user: {} to server: {}", 
                   event.getUserEmail(), event.getServerName());
    }

    /**
     * Why: Xử lý server join confirmation event
     * Context: Gửi confirmation email khi user join server thành công
     */
    private void handleServerMemberJoinedEvent(EmailEvent event) {
        logger.info("Processing server member joined event for user: {}", event.getUserEmail());

        if (event.getUserEmail() == null || event.getServerName() == null) {
            logger.warn("Missing required join data in event: {}", event);
            return;
        }

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("userName", event.getUserName());
        templateVariables.put("userEmail", event.getUserEmail());
        templateVariables.put("serverName", event.getServerName());
        templateVariables.put("serverUrl", "https://flux.com/servers/" + event.getServerId());
        templateVariables.put("supportEmail", "support@flux.com");
        templateVariables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));

        templateVariables.putAll(event.getAdditionalData());

        emailQueueService.queueEmail(
            event.getUserEmail(),
            event.getUserName(),
            "SERVER_JOIN_CONFIRMATION",
            templateVariables,
            3 // Medium priority
        );

        logger.info("Queued join confirmation email for user: {} in server: {}", 
                   event.getUserEmail(), event.getServerName());
    }

    /**
     * Why: Xử lý password reset event
     * Context: Gửi reset password email với secure token
     */
    private void handlePasswordResetEvent(EmailEvent event) {
        logger.info("Processing password reset event for user: {}", event.getUserEmail());

        if (event.getUserEmail() == null || event.getResetToken() == null) {
            logger.warn("Missing required reset data in event: {}", event);
            return;
        }

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("userName", event.getUserName());
        templateVariables.put("userEmail", event.getUserEmail());
        templateVariables.put("resetUrl", "https://flux.com/reset-password?token=" + event.getResetToken());
        templateVariables.put("resetToken", event.getResetToken());
        templateVariables.put("expiryMinutes", "30");
        templateVariables.put("supportEmail", "support@flux.com");
        templateVariables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));

        templateVariables.putAll(event.getAdditionalData());

        emailQueueService.queueEmail(
            event.getUserEmail(),
            event.getUserName(),
            "PASSWORD_RESET",
            templateVariables,
            1 // Highest priority
        );

        logger.info("Queued password reset email for user: {}", event.getUserEmail());
    }

    /**
     * Why: Xử lý server created event
     * Context: Gửi congratulations email cho server owner
     */
    private void handleServerCreatedEvent(EmailEvent event) {
        logger.info("Processing server created event for user: {}", event.getUserEmail());

        if (event.getUserEmail() == null || event.getServerName() == null) {
            logger.warn("Missing required server creation data in event: {}", event);
            return;
        }

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("userName", event.getUserName());
        templateVariables.put("userEmail", event.getUserEmail());
        templateVariables.put("serverName", event.getServerName());
        templateVariables.put("serverUrl", "https://flux.com/servers/" + event.getServerId());
        templateVariables.put("manageUrl", "https://flux.com/servers/" + event.getServerId() + "/settings");
        templateVariables.put("supportEmail", "support@flux.com");
        templateVariables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));

        templateVariables.putAll(event.getAdditionalData());

        emailQueueService.queueEmail(
            event.getUserEmail(),
            event.getUserName(),
            "SERVER_CREATED",
            templateVariables,
            3 // Medium priority
        );

        logger.info("Queued server creation email for user: {} for server: {}", 
                   event.getUserEmail(), event.getServerName());
    }
}
