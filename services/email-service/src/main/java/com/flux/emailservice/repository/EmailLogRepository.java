package com.flux.emailservice.repository;

import com.flux.emailservice.entity.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Why: JPA repository cho EmailLog entity
 * Context: Database access layer cho email delivery tracking
 */
@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    /**
     * Why: Tìm logs theo email queue ID
     * Context: Track delivery status của specific email
     */
    List<EmailLog> findByEmailQueueIdOrderByCreatedAtDesc(Long emailQueueId);

    /**
     * Why: Tìm logs theo recipient email
     * Context: User support để track email history
     */
    Page<EmailLog> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail, Pageable pageable);

    /**
     * Why: Tìm logs theo status
     * Context: Monitor delivery performance
     */
    Page<EmailLog> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Why: Count delivery statistics
     * Context: Email service performance metrics
     */
    @Query("SELECT el.status, COUNT(el) FROM EmailLog el " +
           "WHERE el.sentAt >= :fromDate GROUP BY el.status")
    List<Object[]> countDeliveryStatusSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Why: Calculate delivery rates
     * Context: Service performance monitoring
     */
    @Query("SELECT " +
           "COUNT(CASE WHEN el.status = 'SENT' THEN 1 END) as sent, " +
           "COUNT(CASE WHEN el.status = 'DELIVERED' THEN 1 END) as delivered, " +
           "COUNT(CASE WHEN el.status = 'BOUNCED' THEN 1 END) as bounced, " +
           "COUNT(CASE WHEN el.status = 'FAILED' THEN 1 END) as failed, " +
           "COUNT(CASE WHEN el.openedAt IS NOT NULL THEN 1 END) as opened, " +
           "COUNT(CASE WHEN el.clickedAt IS NOT NULL THEN 1 END) as clicked " +
           "FROM EmailLog el " +
           "WHERE el.sentAt >= :fromDate")
    Object getDeliveryMetricsSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Why: Tìm emails opened trong time period
     * Context: Engagement metrics
     */
    @Query("SELECT el FROM EmailLog el WHERE " +
           "el.openedAt >= :fromDate AND el.openedAt <= :toDate " +
           "ORDER BY el.openedAt DESC")
    List<EmailLog> findEmailsOpenedBetween(@Param("fromDate") LocalDateTime fromDate,
                                          @Param("toDate") LocalDateTime toDate);

    /**
     * Why: Tìm emails clicked trong time period
     * Context: Engagement metrics
     */
    @Query("SELECT el FROM EmailLog el WHERE " +
           "el.clickedAt >= :fromDate AND el.clickedAt <= :toDate " +
           "ORDER BY el.clickedAt DESC")
    List<EmailLog> findEmailsClickedBetween(@Param("fromDate") LocalDateTime fromDate,
                                           @Param("toDate") LocalDateTime toDate);

    /**
     * Why: Average delivery time
     * Context: Performance monitoring
     */
    @Query("SELECT AVG(FUNCTION('EXTRACT', EPOCH FROM (el.deliveredAt - el.sentAt))) " +
           "FROM EmailLog el WHERE " +
           "el.deliveredAt IS NOT NULL AND el.sentAt >= :fromDate")
    Double getAverageDeliveryTimeSecondsSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Why: Bounce rate calculation
     * Context: Email reputation monitoring
     */
    @Query("SELECT " +
           "(COUNT(CASE WHEN el.status = 'BOUNCED' THEN 1 END) * 100.0 / COUNT(el)) as bounceRate " +
           "FROM EmailLog el WHERE el.sentAt >= :fromDate")
    Double getBounceRateSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Why: Top bouncing domains
     * Context: Email deliverability analysis
     */
    @Query("SELECT SUBSTRING(el.recipientEmail, LOCATE('@', el.recipientEmail) + 1) as domain, " +
           "COUNT(el) as bounceCount " +
           "FROM EmailLog el WHERE " +
           "el.status = 'BOUNCED' AND el.sentAt >= :fromDate " +
           "GROUP BY domain " +
           "ORDER BY bounceCount DESC")
    List<Object[]> getTopBouncingDomainsSince(@Param("fromDate") LocalDateTime fromDate,
                                             Pageable pageable);

    /**
     * Why: Email engagement by hour
     * Context: Optimal sending time analysis
     */
    @Query("SELECT FUNCTION('EXTRACT', HOUR FROM el.openedAt) as hour, COUNT(el) as openCount " +
           "FROM EmailLog el WHERE " +
           "el.openedAt >= :fromDate " +
           "GROUP BY hour " +
           "ORDER BY hour")
    List<Object[]> getEmailOpensByHourSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Why: Clean up old logs
     * Context: Data retention policy
     */
    @Query("SELECT el FROM EmailLog el WHERE el.createdAt < :cutoffDate")
    List<EmailLog> findOldLogs(@Param("cutoffDate") LocalDateTime cutoffDate, Pageable pageable);
}
