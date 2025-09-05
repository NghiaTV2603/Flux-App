package com.flux.emailservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Why: Cấu hình database và JPA repositories
 * Context: Enable JPA repositories, transaction management và auditing
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.flux.emailservice.repository")
@EnableTransactionManagement
@EnableJpaAuditing
public class DatabaseConfig {
    
    // Why: Spring Boot auto-configuration sẽ handle database setup
    // Context: Configuration được define trong application.yml
    // Why: @EnableJpaAuditing enables automatic @CreatedDate và @LastModifiedDate
}
