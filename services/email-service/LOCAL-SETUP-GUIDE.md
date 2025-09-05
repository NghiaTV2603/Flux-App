# Email Service - Local Setup Guide

## 🎯 Yêu cầu

- ✅ Java 17+
- ✅ Maven 3.9+
- ✅ PostgreSQL đã chạy (port 5432)
- ✅ Redis đã chạy (port 6379)
- ✅ RabbitMQ đã chạy (port 5672)

## 📋 Bước 1: Cấu hình Database

### 1.1 Tạo Database và User

Chạy SQL script để tạo database:

```bash
# Kết nối PostgreSQL với admin user
psql -U postgres -h localhost

# Hoặc chạy script trực tiếp
psql -U postgres -h localhost -f setup-database.sql
```

### 1.2 Verify Database Connection

```bash
# Test connection
psql -h localhost -p 5432 -U flux_user -d flux_email_db -c "SELECT current_database();"
```

## 📋 Bước 2: Cấu hình Environment

### 2.1 Setup Email Configuration

Edit file `local.env` và cập nhật SMTP settings:

```bash
# For Gmail (recommended for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
```

**🔐 Gmail App Password Setup:**

1. Enable 2-factor authentication trên Gmail
2. Go to: Google Account → Security → App passwords
3. Generate password cho "Mail"
4. Use generated password trong `SMTP_PASSWORD`

### 2.2 Verify Service Connections

```bash
# Check PostgreSQL
psql -h localhost -p 5432 -U flux_user -d flux_email_db -c "SELECT 1;"

# Check Redis
redis-cli -h localhost -p 6379 ping

# Check RabbitMQ
curl -u guest:guest http://localhost:15672/api/overview
```

## 🚀 Bước 3: Chạy Service

### 3.1 Quick Start

```bash
# Run with script (recommended)
./run-local.sh
```

### 3.2 Manual Start

```bash
# Load environment variables
export $(grep -v '^#' local.env | xargs)

# Build project
mvn clean compile

# Run application
mvn spring-boot:run -Dspring-boot.run.profiles=development
```

### 3.3 Alternative với IDE

1. Import project vào IntelliJ/Eclipse
2. Set environment variables từ `local.env`
3. Run `EmailServiceApplication.main()`

## ✅ Bước 4: Verify Service

### 4.1 Health Check

```bash
# Basic health check
curl http://localhost:8085/api/v1/actuator/health

# Detailed health check
curl http://localhost:8085/api/v1/actuator/health | jq
```

Expected response:

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "UP" },
    "rabbit": { "status": "UP" },
    "mail": { "status": "UP" }
  }
}
```

### 4.2 Check Logs

Service sẽ log kết nối status:

```
INFO  - Email Service started successfully
INFO  - Database connection established
INFO  - Redis connection established
INFO  - RabbitMQ connection established
INFO  - SMTP connection verified
```

### 4.3 Database Tables

Sau khi start, check tables được tạo:

```sql
\c flux_email_db
\dt
```

Expected tables:

- `email_templates`
- `email_queue`
- `email_logs`
- `email_settings`

## 🧪 Bước 5: Test Email Service

### 5.1 Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:8085/api/v1/actuator/health

# Test metrics
curl http://localhost:8085/api/v1/actuator/metrics

# Test Prometheus metrics
curl http://localhost:8085/api/v1/actuator/prometheus
```

### 5.2 Test với HTTP Client

Use `test-email-service.http` file:

- Open trong VS Code với REST Client extension
- Hoặc import vào Postman/Insomnia

## 🔧 Troubleshooting

### ❌ Common Issues

#### 1. Database Connection Failed

```
Error: connection to server on socket failed
```

**Solution:**

- Verify PostgreSQL is running: `ps aux | grep postgres`
- Check port: `netstat -an | grep 5432`
- Verify credentials trong `local.env`

#### 2. Redis Connection Failed

```
Error: Unable to connect to Redis
```

**Solution:**

- Check Redis: `redis-cli ping`
- Verify port: `netstat -an | grep 6379`

#### 3. RabbitMQ Connection Failed

```
Error: Connection refused to RabbitMQ
```

**Solution:**

- Check RabbitMQ: `rabbitmqctl status`
- Verify management UI: http://localhost:15672
- Check credentials: guest/guest (default)

#### 4. SMTP Authentication Failed

```
Error: Authentication failed for SMTP
```

**Solution:**

- Use Gmail App Password (not regular password)
- Enable 2FA on Gmail account
- Verify SMTP settings trong `local.env`

#### 5. Port Already in Use

```
Error: Port 8085 already in use
```

**Solution:**

- Change `SERVER_PORT` trong `local.env`
- Kill process: `lsof -ti:8085 | xargs kill -9`

### 📋 Debug Commands

```bash
# Check running processes
ps aux | grep java

# Check port usage
lsof -i :8085
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :5672  # RabbitMQ

# Check logs với detailed output
mvn spring-boot:run -Dspring-boot.run.profiles=development -Dlogging.level.com.flux=DEBUG

# Test individual connections
telnet localhost 5432  # PostgreSQL
telnet localhost 6379  # Redis
telnet localhost 5672  # RabbitMQ
```

## 🎯 Next Steps

Sau khi service chạy thành công:

1. **Tạo Email Templates** - Add default templates vào database
2. **Test Event Processing** - Send test events từ other services
3. **Integration Testing** - Verify với real email sending
4. **Performance Testing** - Load test với batch emails

## 📞 Support

Nếu gặp vấn đề:

1. Check application logs
2. Verify all dependencies đang chạy
3. Test individual connections
4. Check environment variables
5. Restart services theo thứ tự: DB → Redis → RabbitMQ → Email Service

