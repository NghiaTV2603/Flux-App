package com.flux.emailservice.repository;

import com.flux.emailservice.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Why: JPA repository cho EmailTemplate entity
 * Context: Database access layer cho email templates
 */
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    /**
     * Why: Tìm template theo name và active status
     * Context: Sử dụng trong email processing để load template
     */
    Optional<EmailTemplate> findByTemplateNameAndIsActiveTrue(String templateName);

    /**
     * Why: Tìm template theo type và active status
     * Context: Lấy tất cả templates của một loại
     */
    List<EmailTemplate> findByTemplateTypeAndIsActiveTrue(String templateType);

    /**
     * Why: Tìm tất cả active templates
     * Context: Admin interface để quản lý templates
     */
    List<EmailTemplate> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Why: Kiểm tra template name đã tồn tại chưa
     * Context: Validation khi tạo template mới
     */
    boolean existsByTemplateName(String templateName);

    /**
     * Why: Tìm templates theo creator
     * Context: Admin tracking và audit
     */
    List<EmailTemplate> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    /**
     * Why: Tìm templates với pagination và sorting
     * Context: Admin interface với large datasets
     */
    @Query("SELECT et FROM EmailTemplate et WHERE " +
           "(:templateType IS NULL OR et.templateType = :templateType) AND " +
           "(:isActive IS NULL OR et.isActive = :isActive) " +
           "ORDER BY et.updatedAt DESC")
    List<EmailTemplate> findTemplatesWithFilters(
            @Param("templateType") String templateType,
            @Param("isActive") Boolean isActive
    );

    /**
     * Why: Count templates by type for statistics
     * Context: Dashboard metrics
     */
    @Query("SELECT et.templateType, COUNT(et) FROM EmailTemplate et " +
           "WHERE et.isActive = true GROUP BY et.templateType")
    List<Object[]> countTemplatesByType();
}
