package com.flux.emailservice.service;

import com.flux.emailservice.config.ApplicationProperties;
import com.flux.emailservice.entity.EmailLog;
import com.flux.emailservice.entity.EmailQueue;
import com.flux.emailservice.repository.EmailLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

/**
 * Why: Service layer cho actual email sending
 * Context: Handles SMTP communication và delivery tracking
 */
@Service
@Transactional
public class EmailSendingService {

    private static final Logger logger = LoggerFactory.getLogger(EmailSendingService.class);

    private final JavaMailSender mailSender;
    private final EmailTemplateService emailTemplateService;
    private final EmailLogRepository emailLogRepository;
    private final ApplicationProperties applicationProperties;
    private final RateLimitService rateLimitService;

    @Autowired
    public EmailSendingService(JavaMailSender mailSender,
                              EmailTemplateService emailTemplateService,
                              EmailLogRepository emailLogRepository,
                              ApplicationProperties applicationProperties,
                              RateLimitService rateLimitService) {
        this.mailSender = mailSender;
        this.emailTemplateService = emailTemplateService;
        this.emailLogRepository = emailLogRepository;
        this.applicationProperties = applicationProperties;
        this.rateLimitService = rateLimitService;
    }

    /**
     * Why: Async email sending để không block main thread
     * Context: Called từ email processing jobs
     */
    @Async("emailTaskExecutor")
    public CompletableFuture<EmailSendResult> sendEmailAsync(EmailQueue emailQueue) {
        logger.info("Sending email async: ID={}, recipient={}", 
                   emailQueue.getId(), emailQueue.getRecipientEmail());

        try {
            EmailSendResult result = sendEmail(emailQueue);
            return CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            logger.error("Async email sending failed for ID: {}", emailQueue.getId(), e);
            EmailSendResult result = EmailSendResult.failure(e.getMessage());
            return CompletableFuture.completedFuture(result);
        }
    }

    /**
     * Why: Synchronous email sending cho immediate sends
     * Context: API calls cần immediate response
     */
    public EmailSendResult sendEmail(EmailQueue emailQueue) {
        logger.info("Sending email: ID={}, recipient={}", 
                   emailQueue.getId(), emailQueue.getRecipientEmail());

        try {
            // Why: Validate recipient trước khi gửi
            if (!isValidRecipient(emailQueue.getRecipientEmail())) {
                String error = "Invalid or blacklisted recipient: " + emailQueue.getRecipientEmail();
                logger.warn(error);
                logEmailFailure(emailQueue, error);
                return EmailSendResult.failure(error);
            }

            // Why: Process template với variables
            EmailTemplateService.ProcessedTemplate processedTemplate = 
                emailTemplateService.processTemplate(
                    emailQueue.getTemplate().getTemplateName(), 
                    emailQueue.getTemplateVariables()
                );

            // Why: Create và send MIME message
            MimeMessage mimeMessage = createMimeMessage(emailQueue, processedTemplate);
            mailSender.send(mimeMessage);

            // Why: Log successful sending
            EmailLog emailLog = logEmailSuccess(emailQueue, processedTemplate.getSubject());
            
            // Why: Update rate limit counter
            rateLimitService.incrementEmailCount(emailQueue.getRecipientEmail());

            logger.info("Email sent successfully: ID={}", emailQueue.getId());
            return EmailSendResult.success(emailLog.getId(), "Email sent successfully");

        } catch (MessagingException e) {
            String error = "Message creation failed: " + e.getMessage();
            logger.error("Email sending failed for ID: {}", emailQueue.getId(), e);
            logEmailFailure(emailQueue, error);
            return EmailSendResult.failure(error);

        } catch (MailException e) {
            String error = "SMTP sending failed: " + e.getMessage();
            logger.error("Email sending failed for ID: {}", emailQueue.getId(), e);
            logEmailFailure(emailQueue, error);
            return EmailSendResult.failure(error);

        } catch (Exception e) {
            String error = "Unexpected error: " + e.getMessage();
            logger.error("Email sending failed for ID: {}", emailQueue.getId(), e);
            logEmailFailure(emailQueue, error);
            return EmailSendResult.failure(error);
        }
    }

    /**
     * Why: Create MIME message từ processed template
     * Context: Setup email headers, content và attachments
     */
    private MimeMessage createMimeMessage(EmailQueue emailQueue, 
                                         EmailTemplateService.ProcessedTemplate processedTemplate) 
            throws MessagingException {
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        // Why: Set sender information
        helper.setFrom(applicationProperties.getFromAddress(), 
                      applicationProperties.getFromName());

        // Why: Set recipient
        helper.setTo(emailQueue.getRecipientEmail());

        // Why: Set subject
        helper.setSubject(processedTemplate.getSubject());

        // Why: Set HTML content với text fallback
        if (processedTemplate.getTextContent() != null && !processedTemplate.getTextContent().isEmpty()) {
            helper.setText(processedTemplate.getTextContent(), processedTemplate.getHtmlContent());
        } else {
            helper.setText(processedTemplate.getHtmlContent(), true);
        }

        // Why: Set headers cho tracking và identification
        message.setHeader("X-Email-Queue-ID", emailQueue.getId().toString());
        message.setHeader("X-Template-Name", processedTemplate.getTemplateName());
        message.setHeader("X-Template-Type", processedTemplate.getTemplateType());
        
        // Why: Set priority header
        if (emailQueue.isHighPriority()) {
            message.setHeader("X-Priority", "1");
            message.setHeader("Importance", "high");
        }

        return message;
    }

    /**
     * Why: Validate recipient email
     * Context: Security và deliverability checks
     */
    private boolean isValidRecipient(String recipientEmail) {
        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            return false;
        }

        // Why: Check blacklist
        if (rateLimitService.isBlacklisted(recipientEmail)) {
            logger.warn("Recipient is blacklisted: {}", recipientEmail);
            return false;
        }

        // Why: Basic email format validation (additional to @Email annotation)
        if (!recipientEmail.matches("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$")) {
            logger.warn("Invalid email format: {}", recipientEmail);
            return false;
        }

        return true;
    }

    /**
     * Why: Log successful email sending
     * Context: Tracking và metrics
     */
    private EmailLog logEmailSuccess(EmailQueue emailQueue, String subject) {
        EmailLog emailLog = new EmailLog(
            emailQueue,
            emailQueue.getRecipientEmail(),
            subject,
            EmailLog.EmailLogStatus.SENT.name()
        );

        return emailLogRepository.save(emailLog);
    }

    /**
     * Why: Log failed email sending
     * Context: Error tracking và debugging
     */
    private EmailLog logEmailFailure(EmailQueue emailQueue, String errorMessage) {
        EmailLog emailLog = new EmailLog(
            emailQueue,
            emailQueue.getRecipientEmail(),
            "Failed to send",
            EmailLog.EmailLogStatus.FAILED.name()
        );

        // Why: Store error details in delivery status
        emailLog.setDeliveryStatus(java.util.Map.of(
            "error", errorMessage,
            "timestamp", LocalDateTime.now().toString(),
            "retryCount", emailQueue.getRetryCount()
        ));

        return emailLogRepository.save(emailLog);
    }

    /**
     * Why: Test email connection
     * Context: Health check và configuration validation
     */
    public boolean testEmailConnection() {
        try {
            // Why: Test SMTP connection
            mailSender.createMimeMessage();
            logger.info("Email connection test successful");
            return true;
        } catch (Exception e) {
            logger.error("Email connection test failed", e);
            return false;
        }
    }

    /**
     * Why: Send test email
     * Context: Admin functionality để test configuration
     */
    public EmailSendResult sendTestEmail(String recipientEmail, String testMessage) {
        logger.info("Sending test email to: {}", recipientEmail);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(applicationProperties.getFromAddress(), 
                          applicationProperties.getFromName());
            helper.setTo(recipientEmail);
            helper.setSubject("Test Email from Flux Email Service");
            
            String htmlContent = String.format("""
                <html>
                <body>
                    <h2>Email Service Test</h2>
                    <p>This is a test email from Flux Email Service.</p>
                    <p><strong>Test Message:</strong> %s</p>
                    <p><strong>Sent at:</strong> %s</p>
                    <hr>
                    <p><small>This is an automated test email.</small></p>
                </body>
                </html>
                """, testMessage, LocalDateTime.now());

            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            
            logger.info("Test email sent successfully to: {}", recipientEmail);
            return EmailSendResult.success(null, "Test email sent successfully");

        } catch (Exception e) {
            String error = "Test email failed: " + e.getMessage();
            logger.error(error, e);
            return EmailSendResult.failure(error);
        }
    }

    /**
     * Why: DTO cho email send result
     * Context: Return structure cho send operations
     */
    public static class EmailSendResult {
        private final boolean success;
        private final String message;
        private final Long emailLogId;
        private final String errorDetails;

        private EmailSendResult(boolean success, String message, Long emailLogId, String errorDetails) {
            this.success = success;
            this.message = message;
            this.emailLogId = emailLogId;
            this.errorDetails = errorDetails;
        }

        public static EmailSendResult success(Long emailLogId, String message) {
            return new EmailSendResult(true, message, emailLogId, null);
        }

        public static EmailSendResult failure(String errorMessage) {
            return new EmailSendResult(false, "Email sending failed", null, errorMessage);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Long getEmailLogId() { return emailLogId; }
        public String getErrorDetails() { return errorDetails; }

        @Override
        public String toString() {
            return String.format("EmailSendResult{success=%s, message='%s', emailLogId=%s}", 
                               success, message, emailLogId);
        }
    }
}
