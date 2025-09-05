# Email Service - Design Document

## Tổng quan

Email Service là một microservice độc lập được xây dựng bằng Spring Boot, chịu trách nhiệm xử lý việc gửi email tự động cho các sự kiện trong hệ thống Flux như đăng ký tài khoản, tham gia server, v.v.

## Mục tiêu

- **Gửi email chào mừng** khi user tạo tài khoản thành công
- **Gửi email thông báo** khi user được mời tham gia server
- **Gửi email xác nhận** khi user tham gia server thành công
- **Quản lý template email** cho các loại email khác nhau
- **Theo dõi trạng thái** gửi email (sent, delivered, failed, bounced)
- **Rate limiting** để tránh spam
- **Retry mechanism** cho các email gửi thất bại

## Kiến trúc Technical

### Tech Stack

- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA với Hibernate
- **Email**: Spring Mail với JavaMailSender
- **Message Queue**: RabbitMQ (nhận events từ các service khác)
- **Caching**: Spring Cache với Redis
- **Template Engine**: Thymeleaf (cho HTML email templates)
- **Monitoring**: Spring Boot Actuator + Micrometer
- **Testing**: JUnit 5, Testcontainers

### Dependencies chính

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-mail</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-amqp</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>

    <!-- Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- Monitoring -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
</dependencies>
```

## Database Schema

### EmailTemplate

Lưu trữ các template email để tái sử dụng

| Field            | Type         | Description                                  |
| ---------------- | ------------ | -------------------------------------------- |
| id               | BIGINT       | Primary Key                                  |
| template_name    | VARCHAR(100) | Tên template (unique)                        |
| template_type    | VARCHAR(50)  | Loại template (WELCOME, SERVER_INVITE, etc.) |
| subject_template | VARCHAR(500) | Template cho subject                         |
| html_content     | TEXT         | Nội dung HTML                                |
| text_content     | TEXT         | Nội dung text (fallback)                     |
| is_active        | BOOLEAN      | Template có đang hoạt động                   |
| created_at       | TIMESTAMP    | Thời gian tạo                                |
| updated_at       | TIMESTAMP    | Thời gian cập nhật                           |
| created_by       | VARCHAR(100) | Người tạo                                    |

### EmailQueue

Queue chứa các email cần gửi

| Field              | Type         | Description                       |
| ------------------ | ------------ | --------------------------------- |
| id                 | BIGINT       | Primary Key                       |
| recipient_email    | VARCHAR(320) | Email người nhận                  |
| recipient_name     | VARCHAR(255) | Tên người nhận                    |
| template_id        | BIGINT       | FK to EmailTemplate               |
| template_variables | JSON         | Biến để thay thế trong template   |
| priority           | INTEGER      | Độ ưu tiên (1=cao, 5=thấp)        |
| status             | VARCHAR(20)  | PENDING, PROCESSING, SENT, FAILED |
| scheduled_at       | TIMESTAMP    | Thời gian dự kiến gửi             |
| sent_at            | TIMESTAMP    | Thời gian gửi thực tế             |
| retry_count        | INTEGER      | Số lần retry                      |
| max_retries        | INTEGER      | Số lần retry tối đa               |
| error_message      | TEXT         | Lỗi nếu gửi thất bại              |
| created_at         | TIMESTAMP    | Thời gian tạo                     |
| updated_at         | TIMESTAMP    | Thời gian cập nhật                |

### EmailLog

Log chi tiết các email đã gửi

| Field               | Type         | Description                            |
| ------------------- | ------------ | -------------------------------------- |
| id                  | BIGINT       | Primary Key                            |
| email_queue_id      | BIGINT       | FK to EmailQueue                       |
| recipient_email     | VARCHAR(320) | Email người nhận                       |
| subject             | VARCHAR(500) | Subject email                          |
| status              | VARCHAR(20)  | SENT, DELIVERED, BOUNCED, FAILED       |
| provider_message_id | VARCHAR(255) | ID từ email provider                   |
| delivery_status     | JSON         | Chi tiết trạng thái delivery           |
| sent_at             | TIMESTAMP    | Thời gian gửi                          |
| delivered_at        | TIMESTAMP    | Thời gian deliver                      |
| opened_at           | TIMESTAMP    | Thời gian mở email (nếu có tracking)   |
| clicked_at          | TIMESTAMP    | Thời gian click link (nếu có tracking) |

### EmailSettings

Cấu hình email cho từng loại

| Field         | Type         | Description          |
| ------------- | ------------ | -------------------- |
| id            | BIGINT       | Primary Key          |
| setting_key   | VARCHAR(100) | Key setting (unique) |
| setting_value | TEXT         | Giá trị setting      |
| description   | VARCHAR(500) | Mô tả                |
| is_active     | BOOLEAN      | Setting có hoạt động |
| created_at    | TIMESTAMP    | Thời gian tạo        |
| updated_at    | TIMESTAMP    | Thời gian cập nhật   |

## API Endpoints

### Email Management APIs

| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| POST   | `/api/v1/emails/send`             | Gửi email ngay lập tức     |
| POST   | `/api/v1/emails/schedule`         | Lên lịch gửi email         |
| GET    | `/api/v1/emails/queue`            | Lấy danh sách email queue  |
| GET    | `/api/v1/emails/queue/{id}`       | Chi tiết email trong queue |
| DELETE | `/api/v1/emails/queue/{id}`       | Hủy email trong queue      |
| POST   | `/api/v1/emails/queue/{id}/retry` | Retry email thất bại       |

### Template Management APIs

| Method | Endpoint                         | Description                   |
| ------ | -------------------------------- | ----------------------------- |
| GET    | `/api/v1/templates`              | Lấy danh sách templates       |
| GET    | `/api/v1/templates/{id}`         | Chi tiết template             |
| POST   | `/api/v1/templates`              | Tạo template mới              |
| PUT    | `/api/v1/templates/{id}`         | Cập nhật template             |
| DELETE | `/api/v1/templates/{id}`         | Xóa template                  |
| POST   | `/api/v1/templates/{id}/preview` | Preview template với data mẫu |

### Statistics & Monitoring APIs

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| GET    | `/api/v1/emails/stats`  | Thống kê gửi email   |
| GET    | `/api/v1/emails/logs`   | Lấy logs email       |
| GET    | `/api/v1/emails/health` | Health check service |

### Admin APIs

| Method | Endpoint                   | Description       |
| ------ | -------------------------- | ----------------- |
| GET    | `/api/v1/admin/settings`   | Lấy cấu hình      |
| PUT    | `/api/v1/admin/settings`   | Cập nhật cấu hình |
| POST   | `/api/v1/admin/test-email` | Gửi test email    |

## Event-Driven Integration

### RabbitMQ Events Subscription

Email Service sẽ lắng nghe các events từ RabbitMQ:

```yaml
# Exchange: app.events
# Routing Keys:
user.created: # Khi user đăng ký thành công
  - Gửi welcome email
  - Template: WELCOME_EMAIL

server.member.invited: # Khi user được mời vào server
  - Gửi server invitation email
  - Template: SERVER_INVITATION

server.member.joined: # Khi user tham gia server thành công
  - Gửi confirmation email
  - Template: SERVER_JOIN_CONFIRMATION

user.password.reset.requested: # Khi user yêu cầu reset password
  - Gửi password reset email
  - Template: PASSWORD_RESET

server.created: # Khi server được tạo
  - Gửi email chúc mừng cho owner
  - Template: SERVER_CREATED
```

### Event Message Format

```json
{
  "eventType": "user.created",
  "eventId": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "data": {
    "userId": "uuid",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "additionalData": {
      // Dữ liệu bổ sung cho template
    }
  }
}
```

## Email Templates

### Template Types

1. **WELCOME_EMAIL**: Chào mừng user mới
2. **SERVER_INVITATION**: Mời tham gia server
3. **SERVER_JOIN_CONFIRMATION**: Xác nhận tham gia server
4. **PASSWORD_RESET**: Reset mật khẩu
5. **SERVER_CREATED**: Chúc mừng tạo server thành công

### Template Variables

Mỗi template sẽ có các biến có thể thay thế:

```json
{
  "userName": "Tên người dùng",
  "userEmail": "Email người dùng",
  "serverName": "Tên server",
  "inviterName": "Người mời",
  "actionUrl": "Link hành động",
  "supportEmail": "Email hỗ trợ",
  "currentYear": "Năm hiện tại"
}
```

## Configuration

### Application Properties

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/flux_email_db
    username: ${DB_USERNAME:flux_user}
    password: ${DB_PASSWORD:flux_password}

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  mail:
    host: ${SMTP_HOST:smtp.gmail.com}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USERNAME:guest}
    password: ${RABBITMQ_PASSWORD:guest}

  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}

  cache:
    type: redis
    redis:
      time-to-live: 600000 # 10 minutes

# Custom properties
app:
  email:
    from-address: ${EMAIL_FROM:noreply@flux.com}
    from-name: ${EMAIL_FROM_NAME:Flux Team}
    retry:
      max-attempts: 3
      delay: 5000 # 5 seconds
    rate-limit:
      per-hour: 100
      per-day: 1000
    batch-size: 10
    template-cache-ttl: 3600 # 1 hour
```

## Security & Best Practices

### Rate Limiting

- Giới hạn số email gửi cho mỗi địa chỉ email (100/giờ, 1000/ngày)
- Sử dụng Redis để track rate limiting

### Email Validation

- Validate format email trước khi gửi
- Blacklist các domain email tạm thời
- Whitelist các domain được phép

### Error Handling

- Retry mechanism với exponential backoff
- Dead letter queue cho emails không gửi được
- Alert khi tỷ lệ lỗi cao

### Monitoring

- Metrics: email sent, failed, delivery rate
- Health checks cho SMTP connection
- Logs chi tiết cho debugging

### Data Protection

- Không log nội dung email
- Encrypt sensitive data trong database
- GDPR compliance cho data retention

## Performance Considerations

### Caching Strategy

- Cache email templates trong Redis
- Cache user preferences
- Cache rate limiting counters

### Database Optimization

- Index trên recipient_email, status, created_at
- Partition email_log table theo tháng
- Regular cleanup cho old logs

### Async Processing

- Sử dụng @Async cho email sending
- Separate thread pool cho email processing
- Batch processing cho bulk emails

## Deployment

### Docker Configuration

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app
COPY target/email-service.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Health Checks

- Database connectivity
- SMTP server connectivity
- RabbitMQ connectivity
- Redis connectivity

Đây là design document hoàn chỉnh cho Email Service. Bạn có muốn tôi tiến hành implement service này không?
