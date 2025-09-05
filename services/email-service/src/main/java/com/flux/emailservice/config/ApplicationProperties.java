package com.flux.emailservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Why: Type-safe configuration properties
 * Context: Centralized configuration cho email service settings
 */
@Configuration
@ConfigurationProperties(prefix = "app.email")
public class ApplicationProperties {

    private String fromAddress = "noreply@flux.com";
    private String fromName = "Flux Team";
    private Retry retry = new Retry();
    private RateLimit rateLimit = new RateLimit();
    private int batchSize = 10;
    private long processingIntervalMs = 30000;
    private Template template = new Template();
    private Security security = new Security();

    // Getters and Setters
    public String getFromAddress() {
        return fromAddress;
    }

    public void setFromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }

    public Retry getRetry() {
        return retry;
    }

    public void setRetry(Retry retry) {
        this.retry = retry;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public long getProcessingIntervalMs() {
        return processingIntervalMs;
    }

    public void setProcessingIntervalMs(long processingIntervalMs) {
        this.processingIntervalMs = processingIntervalMs;
    }

    public Template getTemplate() {
        return template;
    }

    public void setTemplate(Template template) {
        this.template = template;
    }

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    /**
     * Why: Nested configuration class cho retry settings
     */
    public static class Retry {
        private int maxAttempts = 3;
        private long delayMs = 5000;
        private double backoffMultiplier = 2.0;

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public long getDelayMs() {
            return delayMs;
        }

        public void setDelayMs(long delayMs) {
            this.delayMs = delayMs;
        }

        public double getBackoffMultiplier() {
            return backoffMultiplier;
        }

        public void setBackoffMultiplier(double backoffMultiplier) {
            this.backoffMultiplier = backoffMultiplier;
        }
    }

    /**
     * Why: Nested configuration class cho rate limiting
     */
    public static class RateLimit {
        private int perHour = 100;
        private int perDay = 1000;

        public int getPerHour() {
            return perHour;
        }

        public void setPerHour(int perHour) {
            this.perHour = perHour;
        }

        public int getPerDay() {
            return perDay;
        }

        public void setPerDay(int perDay) {
            this.perDay = perDay;
        }
    }

    /**
     * Why: Nested configuration class cho template settings
     */
    public static class Template {
        private long cacheTtlSeconds = 3600;

        public long getCacheTtlSeconds() {
            return cacheTtlSeconds;
        }

        public void setCacheTtlSeconds(long cacheTtlSeconds) {
            this.cacheTtlSeconds = cacheTtlSeconds;
        }
    }

    /**
     * Why: Nested configuration class cho security settings
     */
    public static class Security {
        private List<String> blacklistDomains = List.of("10minutemail.com", "tempmail.org");
        private boolean whitelistEnabled = false;
        private List<String> whitelistDomains = List.of();

        public List<String> getBlacklistDomains() {
            return blacklistDomains;
        }

        public void setBlacklistDomains(List<String> blacklistDomains) {
            this.blacklistDomains = blacklistDomains;
        }

        public boolean isWhitelistEnabled() {
            return whitelistEnabled;
        }

        public void setWhitelistEnabled(boolean whitelistEnabled) {
            this.whitelistEnabled = whitelistEnabled;
        }

        public List<String> getWhitelistDomains() {
            return whitelistDomains;
        }

        public void setWhitelistDomains(List<String> whitelistDomains) {
            this.whitelistDomains = whitelistDomains;
        }
    }
}
