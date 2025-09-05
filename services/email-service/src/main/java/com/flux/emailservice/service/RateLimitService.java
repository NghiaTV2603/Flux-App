package com.flux.emailservice.service;

import com.flux.emailservice.config.ApplicationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * Why: Service cho rate limiting functionality
 * Context: Prevent email spam và abuse protection
 */
@Service
public class RateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitService.class);
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ApplicationProperties applicationProperties;

    // Why: Key patterns cho different time windows
    private static final String HOURLY_KEY_PREFIX = "rate_limit:hourly:";
    private static final String DAILY_KEY_PREFIX = "rate_limit:daily:";
    
    private static final DateTimeFormatter HOUR_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd-HH");
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    public RateLimitService(RedisTemplate<String, Object> redisTemplate,
                           ApplicationProperties applicationProperties) {
        this.redisTemplate = redisTemplate;
        this.applicationProperties = applicationProperties;
    }

    /**
     * Why: Check if email sending is allowed cho recipient
     * Context: Called trước khi queue email
     */
    public boolean isAllowed(String recipientEmail) {
        boolean hourlyAllowed = checkHourlyLimit(recipientEmail);
        boolean dailyAllowed = checkDailyLimit(recipientEmail);
        
        boolean allowed = hourlyAllowed && dailyAllowed;
        
        if (!allowed) {
            logger.warn("Rate limit exceeded for email: {} (hourly: {}, daily: {})", 
                       recipientEmail, hourlyAllowed, dailyAllowed);
        }
        
        return allowed;
    }

    /**
     * Why: Increment counter when email is queued
     * Context: Track email count for rate limiting
     */
    public void incrementEmailCount(String recipientEmail) {
        incrementHourlyCount(recipientEmail);
        incrementDailyCount(recipientEmail);
        
        logger.debug("Incremented email count for: {}", recipientEmail);
    }

    /**
     * Why: Check hourly rate limit
     * Context: Prevent excessive emails trong 1 giờ
     */
    private boolean checkHourlyLimit(String recipientEmail) {
        String hourKey = getHourlyKey(recipientEmail);
        Integer currentCount = (Integer) redisTemplate.opsForValue().get(hourKey);
        
        if (currentCount == null) {
            currentCount = 0;
        }
        
        int hourlyLimit = applicationProperties.getRateLimit().getPerHour();
        boolean allowed = currentCount < hourlyLimit;
        
        logger.debug("Hourly check for {}: {}/{} (allowed: {})", 
                    recipientEmail, currentCount, hourlyLimit, allowed);
        
        return allowed;
    }

    /**
     * Why: Check daily rate limit
     * Context: Prevent excessive emails trong 1 ngày
     */
    private boolean checkDailyLimit(String recipientEmail) {
        String dayKey = getDailyKey(recipientEmail);
        Integer currentCount = (Integer) redisTemplate.opsForValue().get(dayKey);
        
        if (currentCount == null) {
            currentCount = 0;
        }
        
        int dailyLimit = applicationProperties.getRateLimit().getPerDay();
        boolean allowed = currentCount < dailyLimit;
        
        logger.debug("Daily check for {}: {}/{} (allowed: {})", 
                    recipientEmail, currentCount, dailyLimit, allowed);
        
        return allowed;
    }

    /**
     * Why: Increment hourly counter
     * Context: Track emails sent trong current hour
     */
    private void incrementHourlyCount(String recipientEmail) {
        String hourKey = getHourlyKey(recipientEmail);
        
        // Why: Increment counter with expiration
        redisTemplate.opsForValue().increment(hourKey);
        redisTemplate.expire(hourKey, Duration.ofHours(1));
    }

    /**
     * Why: Increment daily counter
     * Context: Track emails sent trong current day
     */
    private void incrementDailyCount(String recipientEmail) {
        String dayKey = getDailyKey(recipientEmail);
        
        // Why: Increment counter with expiration
        redisTemplate.opsForValue().increment(dayKey);
        redisTemplate.expire(dayKey, Duration.ofDays(1));
    }

    /**
     * Why: Generate hourly key
     * Context: Redis key cho hourly rate limiting
     */
    private String getHourlyKey(String recipientEmail) {
        String currentHour = LocalDateTime.now().format(HOUR_FORMATTER);
        return HOURLY_KEY_PREFIX + recipientEmail + ":" + currentHour;
    }

    /**
     * Why: Generate daily key
     * Context: Redis key cho daily rate limiting
     */
    private String getDailyKey(String recipientEmail) {
        String currentDay = LocalDateTime.now().format(DAY_FORMATTER);
        return DAILY_KEY_PREFIX + recipientEmail + ":" + currentDay;
    }

    /**
     * Why: Get current email count for recipient
     * Context: Admin monitoring và debugging
     */
    public RateLimitStatus getRateLimitStatus(String recipientEmail) {
        String hourKey = getHourlyKey(recipientEmail);
        String dayKey = getDailyKey(recipientEmail);
        
        Integer hourlyCount = (Integer) redisTemplate.opsForValue().get(hourKey);
        Integer dailyCount = (Integer) redisTemplate.opsForValue().get(dayKey);
        
        Long hourlyTtl = redisTemplate.getExpire(hourKey, TimeUnit.SECONDS);
        Long dailyTtl = redisTemplate.getExpire(dayKey, TimeUnit.SECONDS);
        
        return new RateLimitStatus(
            recipientEmail,
            hourlyCount != null ? hourlyCount : 0,
            applicationProperties.getRateLimit().getPerHour(),
            hourlyTtl != null ? hourlyTtl : 0,
            dailyCount != null ? dailyCount : 0,
            applicationProperties.getRateLimit().getPerDay(),
            dailyTtl != null ? dailyTtl : 0
        );
    }

    /**
     * Why: Reset rate limit for recipient
     * Context: Admin action để clear rate limit
     */
    public void resetRateLimit(String recipientEmail) {
        String hourKey = getHourlyKey(recipientEmail);
        String dayKey = getDailyKey(recipientEmail);
        
        redisTemplate.delete(hourKey);
        redisTemplate.delete(dayKey);
        
        logger.info("Rate limit reset for: {}", recipientEmail);
    }

    /**
     * Why: Check if recipient is in whitelist
     * Context: Bypass rate limiting for trusted recipients
     */
    public boolean isWhitelisted(String recipientEmail) {
        // Why: Check domain whitelist if enabled
        if (applicationProperties.getSecurity().isWhitelistEnabled()) {
            String domain = extractDomain(recipientEmail);
            return applicationProperties.getSecurity().getWhitelistDomains().contains(domain);
        }
        
        return false;
    }

    /**
     * Why: Check if recipient is blacklisted
     * Context: Block emails to suspicious domains
     */
    public boolean isBlacklisted(String recipientEmail) {
        String domain = extractDomain(recipientEmail);
        return applicationProperties.getSecurity().getBlacklistDomains().contains(domain);
    }

    /**
     * Why: Extract domain from email
     * Context: Domain-based filtering
     */
    private String extractDomain(String email) {
        int atIndex = email.lastIndexOf('@');
        return atIndex > 0 ? email.substring(atIndex + 1).toLowerCase() : "";
    }

    /**
     * Why: DTO cho rate limit status
     * Context: API response structure
     */
    public static class RateLimitStatus {
        private final String recipientEmail;
        private final int hourlyCount;
        private final int hourlyLimit;
        private final long hourlyResetSeconds;
        private final int dailyCount;
        private final int dailyLimit;
        private final long dailyResetSeconds;

        public RateLimitStatus(String recipientEmail, int hourlyCount, int hourlyLimit, 
                              long hourlyResetSeconds, int dailyCount, int dailyLimit, 
                              long dailyResetSeconds) {
            this.recipientEmail = recipientEmail;
            this.hourlyCount = hourlyCount;
            this.hourlyLimit = hourlyLimit;
            this.hourlyResetSeconds = hourlyResetSeconds;
            this.dailyCount = dailyCount;
            this.dailyLimit = dailyLimit;
            this.dailyResetSeconds = dailyResetSeconds;
        }

        // Getters
        public String getRecipientEmail() { return recipientEmail; }
        public int getHourlyCount() { return hourlyCount; }
        public int getHourlyLimit() { return hourlyLimit; }
        public long getHourlyResetSeconds() { return hourlyResetSeconds; }
        public int getDailyCount() { return dailyCount; }
        public int getDailyLimit() { return dailyLimit; }
        public long getDailyResetSeconds() { return dailyResetSeconds; }
        
        public boolean isHourlyLimitExceeded() { return hourlyCount >= hourlyLimit; }
        public boolean isDailyLimitExceeded() { return dailyCount >= dailyLimit; }
        public boolean isAllowed() { return !isHourlyLimitExceeded() && !isDailyLimitExceeded(); }
    }
}
