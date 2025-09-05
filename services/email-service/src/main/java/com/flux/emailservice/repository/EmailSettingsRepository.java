package com.flux.emailservice.repository;

import com.flux.emailservice.entity.EmailSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Why: JPA repository cho EmailSettings entity
 * Context: Database access layer cho dynamic configuration
 */
@Repository
public interface EmailSettingsRepository extends JpaRepository<EmailSettings, Long> {

    /**
     * Why: Tìm setting theo key
     * Context: Load configuration values
     */
    Optional<EmailSettings> findBySettingKey(String settingKey);

    /**
     * Why: Tìm active setting theo key
     * Context: Load only active configuration
     */
    Optional<EmailSettings> findBySettingKeyAndIsActiveTrue(String settingKey);

    /**
     * Why: Tìm tất cả active settings
     * Context: Load all configuration at startup
     */
    List<EmailSettings> findByIsActiveTrueOrderBySettingKey();

    /**
     * Why: Tìm settings theo key pattern
     * Context: Load related configurations (e.g., all SMTP settings)
     */
    @Query("SELECT es FROM EmailSettings es WHERE " +
           "es.settingKey LIKE :keyPattern AND es.isActive = true " +
           "ORDER BY es.settingKey")
    List<EmailSettings> findBySettingKeyPattern(@Param("keyPattern") String keyPattern);

    /**
     * Why: Check if setting key exists
     * Context: Validation when creating new settings
     */
    boolean existsBySettingKey(String settingKey);

    /**
     * Why: Count active settings
     * Context: Admin dashboard metrics
     */
    @Query("SELECT COUNT(es) FROM EmailSettings es WHERE es.isActive = true")
    Long countActiveSettings();

    /**
     * Why: Tìm settings by category (prefix)
     * Context: Group related settings together
     */
    @Query("SELECT es FROM EmailSettings es WHERE " +
           "es.settingKey LIKE CONCAT(:prefix, '%') AND es.isActive = true " +
           "ORDER BY es.settingKey")
    List<EmailSettings> findByKeyPrefix(@Param("prefix") String prefix);
}
