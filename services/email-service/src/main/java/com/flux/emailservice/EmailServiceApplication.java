package com.flux.emailservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Why: Main application class cho Email Service
 * Context: Spring Boot application với async processing và caching enabled
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
public class EmailServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmailServiceApplication.class, args);
    }
}
