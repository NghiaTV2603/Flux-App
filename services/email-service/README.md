# Email Service

Email Service là một microservice được xây dựng bằng Spring Boot để xử lý việc gửi email tự động trong hệ thống Flux.

## Tính năng chính

- ✅ **Email Templates Management** - Quản lý template có thể tái sử dụng
- ✅ **Event-driven Processing** - Lắng nghe events từ RabbitMQ
- ✅ **Email Queue System** - Hệ thống hàng đợi với priority và retry
- ✅ **Rate Limiting** - Giới hạn spam và abuse
- ✅ **Email Tracking** - Theo dõi trạng thái gửi/nhận email
- ✅ **Redis Caching** - Cache templates và rate limiting
- ✅ **Async Processing** - Xử lý email không đồng bộ

## Tech Stack

- **Framework**: Spring Boot 3.2.1
- **Language**: Java 17+
- **Database**: PostgreSQL + Redis
- **Message Queue**: RabbitMQ
- **Template Engine**: Thymeleaf
- **Email Provider**: JavaMailSender (SMTP)

## Cài đặt

### 1. Prerequisites

- Java 17+
- Maven 3.9+
- PostgreSQL 13+
- Redis 6+
- RabbitMQ 3.8+

### 2. Configuration

Copy file environment variables:

```bash
cp env.example .env
```

Cập nhật các biến trong `.env`:

- Database connection
- SMTP settings
- RabbitMQ connection
- Redis connection

### 3. Database Setup

Tạo database:

```sql
CREATE DATABASE flux_email_db;
CREATE USER flux_user WITH PASSWORD 'flux_password';
GRANT ALL PRIVILEGES ON DATABASE flux_email_db TO flux_user;
```

### 4. Build và Run

```bash
# Build project
mvn clean package

# Run application
mvn spring-boot:run

# Hoặc chạy JAR file
java -jar target/email-service-1.0.0-SNAPSHOT.jar
```

## API Endpoints

### Email Management

| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| POST   | `/api/v1/emails/send`             | Gửi email ngay lập tức     |
| POST   | `/api/v1/emails/schedule`         | Lên lịch gửi email         |
| GET    | `/api/v1/emails/queue`            | Lấy danh sách email queue  |
| GET    | `/api/v1/emails/queue/{id}`       | Chi tiết email trong queue |
| POST   | `/api/v1/emails/queue/{id}/retry` | Retry email thất bại       |

### Template Management

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/api/v1/templates`      | Lấy danh sách templates |
| POST   | `/api/v1/templates`      | Tạo template mới        |
| GET    | `/api/v1/templates/{id}` | Chi tiết template       |
| PUT    | `/api/v1/templates/{id}` | Cập nhật template       |

### Health & Monitoring

| Method | Endpoint                   | Description      |
| ------ | -------------------------- | ---------------- |
| GET    | `/api/v1/actuator/health`  | Health check     |
| GET    | `/api/v1/actuator/metrics` | Metrics          |
| GET    | `/api/v1/emails/stats`     | Email statistics |

## Event Processing

Email Service lắng nghe các events từ RabbitMQ:

### User Events

- `user.created` → **Welcome Email**
- `user.password.reset.requested` → **Password Reset Email**

### Server Events

- `server.created` → **Server Created Email**
- `server.member.invited` → **Server Invitation Email**
- `server.member.joined` → **Join Confirmation Email**

### Event Format

```json
{
  "eventType": "user.created",
  "eventId": "uuid",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0",
  "data": {
    "userId": "uuid",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "additionalData": {}
  }
}
```

## Email Templates

### Các template types có sẵn:

1. **WELCOME_EMAIL** - Chào mừng user mới
2. **SERVER_INVITATION** - Mời tham gia server
3. **SERVER_JOIN_CONFIRMATION** - Xác nhận join server
4. **PASSWORD_RESET** - Reset mật khẩu
5. **SERVER_CREATED** - Chúc mừng tạo server

### Template Variables

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

## Docker

### Build Docker Image

```bash
docker build -t flux-email-service .
```

### Run với Docker Compose

```yaml
version: "3.8"
services:
  email-service:
    build: .
    ports:
      - "8085:8085"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - DB_HOST=postgres
      - RABBITMQ_HOST=rabbitmq
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - rabbitmq
      - redis
```

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:8085/api/v1/actuator/health

# Detailed health with dependencies
curl http://localhost:8085/api/v1/actuator/health?showDetails=true
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:8085/api/v1/actuator/prometheus

# Email statistics
curl http://localhost:8085/api/v1/emails/stats
```

## Development

### Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify
```

### Database Migration

Application sử dụng Hibernate DDL auto-generation. Trong production, nên sử dụng Flyway hoặc Liquibase.

### Debugging

Enable debug logging:

```properties
logging.level.com.flux.emailservice=DEBUG
logging.level.org.springframework.mail=DEBUG
logging.level.org.springframework.amqp=DEBUG
```

## Production Considerations

### Performance Tuning

- Cấu hình connection pool size phù hợp với load
- Điều chỉnh RabbitMQ consumer concurrency
- Monitor memory usage và GC tuning

### Security

- Sử dụng strong passwords cho SMTP
- Enable TLS cho database connections
- Rate limiting protection
- Email domain validation

### Monitoring

- Setup alerting cho failed emails
- Monitor queue sizes
- Track delivery rates
- Database performance monitoring

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**

   - Kiểm tra username/password
   - Enable "Less secure app access" nếu dùng Gmail
   - Sử dụng App Passwords cho Gmail

2. **RabbitMQ Connection Issues**

   - Verify connection parameters
   - Check network connectivity
   - Ensure RabbitMQ is running

3. **High Memory Usage**
   - Increase JVM heap size
   - Check for memory leaks
   - Monitor Redis memory usage

### Support

- Technical Documentation: `/docs/EMAIL-SERVICE-DESIGN.md`
- Architecture Diagrams: `/diagrams/`
- Issue Tracking: GitHub Issues
