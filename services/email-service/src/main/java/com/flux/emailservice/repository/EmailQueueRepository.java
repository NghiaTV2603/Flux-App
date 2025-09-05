package com.flux.emailservice.repository;

import com.flux.emailservice.entity.EmailQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Why: JPA repository cho EmailQueue entity
 * Context: Database access layer cho email queue management
 */
@Repository
public interface EmailQueueRepository extends JpaRepository<EmailQueue, Long> {

    /**
     * Why: Tìm emails cần gửi theo priority và scheduled time
     * Context: Email processing job để lấy emails cần gửi
     */
    @Query("SELECT eq FROM EmailQueue eq WHERE " +
           "eq.status = 'PENDING' AND " +
           "eq.scheduledAt <= :currentTime " +
           "ORDER BY eq.priority ASC, eq.scheduledAt ASC")
    List<EmailQueue> findEmailsToSend(
            @Param("currentTime") LocalDateTime currentTime,
            Pageable pageable
    );

    /**
     * Why: Tìm failed emails có thể retry
     * Context: Retry mechanism cho failed emails
     */
    @Query("SELECT eq FROM EmailQueue eq WHERE " +
           "eq.status = 'FAILED' AND " +
           "eq.retryCount < eq.maxRetries " +
           "ORDER BY eq.priority ASC, eq.updatedAt ASC")
    List<EmailQueue> findEmailsForRetry(Pageable pageable);

    /**
     * Why: Tìm emails theo status với pagination
     * Context: Admin interface để monitor email queue
     */
    Page<EmailQueue> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Why: Tìm emails theo recipient với pagination
     * Context: User support để track emails sent to specific user
     */
    Page<EmailQueue> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail, Pageable pageable);

    /**
     * Why: Count emails by status cho dashboard
     * Context: Monitoring và metrics
     */
    @Query("SELECT eq.status, COUNT(eq) FROM EmailQueue eq GROUP BY eq.status")
    List<Object[]> countEmailsByStatus();

    /**
     * Why: Count emails by priority
     * Context: Queue management metrics
     */
    @Query("SELECT eq.priority, COUNT(eq) FROM EmailQueue eq " +
           "WHERE eq.status = 'PENDING' GROUP BY eq.priority")
    List<Object[]> countPendingEmailsByPriority();

    /**
     * Why: Bulk update status cho processing
     * Context: Mark emails as processing to prevent duplicate sending
     */
    @Modifying
    @Query("UPDATE EmailQueue eq SET eq.status = 'PROCESSING', eq.updatedAt = :currentTime " +
           "WHERE eq.id IN :ids")
    int markEmailsAsProcessing(@Param("ids") List<Long> ids, 
                               @Param("currentTime") LocalDateTime currentTime);

    /**
     * Why: Tìm old processed emails cho cleanup
     * Context: Data retention policy
     */
    @Query("SELECT eq FROM EmailQueue eq WHERE " +
           "eq.status IN ('SENT', 'FAILED') AND " +
           "eq.updatedAt < :cutoffDate")
    List<EmailQueue> findOldProcessedEmails(@Param("cutoffDate") LocalDateTime cutoffDate, 
                                           Pageable pageable);

    /**
     * Why: Count emails per recipient trong time period
     * Context: Rate limiting enforcement
     */
    @Query("SELECT COUNT(eq) FROM EmailQueue eq WHERE " +
           "eq.recipientEmail = :email AND " +
           "eq.createdAt >= :fromTime")
    Long countEmailsForRecipientSince(@Param("email") String email, 
                                     @Param("fromTime") LocalDateTime fromTime);

    /**
     * Why: Tìm high priority emails
     * Context: Priority processing
     */
    @Query("SELECT eq FROM EmailQueue eq WHERE " +
           "eq.status = 'PENDING' AND " +
           "eq.priority <= 2 AND " +
           "eq.scheduledAt <= :currentTime " +
           "ORDER BY eq.priority ASC, eq.scheduledAt ASC")
    List<EmailQueue> findHighPriorityEmails(@Param("currentTime") LocalDateTime currentTime,
                                           Pageable pageable);

    /**
     * Why: Statistics query cho dashboard
     * Context: Email service performance metrics
     */
    @Query("SELECT " +
           "COUNT(CASE WHEN eq.status = 'PENDING' THEN 1 END) as pending, " +
           "COUNT(CASE WHEN eq.status = 'PROCESSING' THEN 1 END) as processing, " +
           "COUNT(CASE WHEN eq.status = 'SENT' THEN 1 END) as sent, " +
           "COUNT(CASE WHEN eq.status = 'FAILED' THEN 1 END) as failed " +
           "FROM EmailQueue eq " +
           "WHERE eq.createdAt >= :fromDate")
    Object getEmailStatsSince(@Param("fromDate") LocalDateTime fromDate);
}
