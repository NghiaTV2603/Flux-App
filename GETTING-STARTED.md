# 🚀 Flux - Hướng dẫn chạy Project từ đầu

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:

- **Docker Desktop** (phiên bản mới nhất)
- **Node.js** 18+
- **npm** hoặc **yarn**
- **Git**

## 🔧 Bước 1: Clone và Setup Project

### 1.1 Clone repository

```bash
git clone <repository-url>
cd flux-project
```

### 1.2 Kiểm tra cấu trúc project

```bash
ls -la
# Bạn sẽ thấy:
# - services/
# - docker/
# - docker-compose.yml
# - start.sh
# - test-setup.sh
# - README.md
```

## 🐳 Bước 2: Khởi động Infrastructure

### 2.1 Khởi động Docker Desktop

Đảm bảo Docker Desktop đang chạy trên máy tính của bạn.

### 2.2 Khởi động databases và message queue

```bash
# Khởi động tất cả databases
docker-compose up -d postgres mongodb redis rabbitmq

# Kiểm tra trạng thái
docker-compose ps
```

Bạn sẽ thấy 4 containers đang chạy:

- `flux-postgres` (Port 5432)
- `flux-mongodb` (Port 27017)
- `flux-redis` (Port 6379)
- `flux-rabbitmq` (Port 5672, Management 15672)

### 2.3 Kiểm tra databases đã sẵn sàng

```bash
# Đợi khoảng 10-15 giây để databases khởi động hoàn toàn
sleep 15

# Kiểm tra PostgreSQL
docker exec flux-postgres pg_isready -U flux_user

# Kiểm tra Redis
docker exec flux-redis redis-cli ping
```

## ⚙️ Bước 3: Setup Auth Service

### 3.1 Cài đặt dependencies

```bash
cd services/auth-service
npm install
```

### 3.2 Tạo file environment

```bash
# Tạo file .env
cat > .env << EOF
DATABASE_URL="postgresql://flux_user:flux_password@localhost:5432/flux_auth_db"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://flux_user:flux_password@localhost:5672"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
EOF
```

### 3.3 Setup database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Mở Prisma Studio để xem database
npx prisma studio
```

### 3.4 Test build

```bash
npm run build
```

### 3.5 Chạy Auth Service

```bash
# Development mode
npm run start:dev

# Service sẽ chạy tại http://localhost:3001
```

## 👤 Bước 4: Setup User Service

### 4.1 Mở terminal mới và cài đặt dependencies

```bash
cd services/user-service
npm install
```

### 4.2 Tạo file environment

```bash
# Tạo file .env
cat > .env << EOF
DATABASE_URL="postgresql://flux_user:flux_password@localhost:5432/flux_user_db"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://flux_user:flux_password@localhost:5672"
PORT=3002
NODE_ENV="development"
EOF
```

### 4.3 Setup database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4.4 Test build

```bash
npm run build
```

### 4.5 Chạy User Service

```bash
# Development mode
npm run start:dev

# Service sẽ chạy tại http://localhost:3002
```

## 🌐 Bước 5: Setup Gateway API

### 5.1 Mở terminal mới và cài đặt dependencies

```bash
cd services/gateway-api
npm install
```

### 5.2 Tạo file environment (nếu cần)

```bash
# Tạo file .env
cat > .env << EOF
NODE_ENV="development"
PORT=3000
AUTH_SERVICE_URL="http://localhost:3001"
USER_SERVICE_URL="http://localhost:3002"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
EOF
```

### 5.3 Test build

```bash
npm run build
```

### 5.4 Chạy Gateway API

```bash
# Development mode
npm run start:dev

# Service sẽ chạy tại http://localhost:3000
```

## 🧪 Bước 6: Test APIs

### 6.1 Sử dụng script test tự động

```bash
# Quay về thư mục gốc
cd ../../

# Chạy test setup
./test-setup.sh
```

### 6.2 Test manual với HTTP client

Sử dụng file `test-api.http` hoặc Postman:

#### Test Auth Service:

```http
# Register user
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123"
}

# Login user
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Test User Service:

```http
# Search users
GET http://localhost:3002/users/search/test
```

## 🚀 Bước 7: Sử dụng Scripts tự động (Khuyến nghị)

### 7.1 Chạy development mode tự động

```bash
# Script này sẽ tự động:
# - Khởi động databases
# - Cài đặt dependencies cho tất cả services
# - Setup databases
# - Hướng dẫn chạy services
./start.sh dev
```

### 7.2 Chạy production mode

```bash
# Script này sẽ build và chạy tất cả services trong Docker
./start.sh
```

## 🔍 Bước 8: Monitoring và Debugging

### 8.1 Xem logs

```bash
# Logs của databases
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f rabbitmq

# Logs của services (nếu chạy bằng Docker)
docker-compose logs -f auth-service
docker-compose logs -f user-service
docker-compose logs -f gateway-api
```

### 8.2 Management UIs

- **RabbitMQ Management**: http://localhost:15672

  - Username: `flux_user`
  - Password: `flux_password`

- **Prisma Studio**:
  ```bash
  cd services/auth-service && npx prisma studio
  cd services/user-service && npx prisma studio
  ```

### 8.3 Database connections

```bash
# Connect to PostgreSQL
docker exec -it flux-postgres psql -U flux_user -d flux_auth_db

# Connect to MongoDB
docker exec -it flux-mongodb mongosh -u flux_user -p flux_password

# Connect to Redis
docker exec -it flux-redis redis-cli
```

## 🛠️ Troubleshooting

### Lỗi thường gặp:

#### 1. Docker không chạy

```bash
# Kiểm tra Docker
docker --version
docker info

# Khởi động Docker Desktop nếu chưa chạy
```

#### 2. Port đã được sử dụng

```bash
# Kiểm tra port đang sử dụng
lsof -i :3001
lsof -i :3002
lsof -i :5432

# Dừng process đang sử dụng port
kill -9 <PID>
```

#### 3. Database connection failed

```bash
# Restart databases
docker-compose restart postgres mongodb redis rabbitmq

# Kiểm tra logs
docker-compose logs postgres
```

#### 4. Prisma errors

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Push schema again
npx prisma db push
```

#### 5. Dependencies errors

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tài liệu tham khảo

- **API Documentation**: Xem file `test-api.http`
- **Database Schema**: Xem files `prisma/schema.prisma` trong mỗi service
- **Architecture**: Xem file `design-markdown.md`
- **Setup Fixes**: Xem file `SETUP-FIXES.md`

## 🎯 Next Steps

Sau khi setup thành công, bạn có thể:

1. **Phát triển thêm features**: Server Service, Channel Service, Message Service
2. **Thêm authentication middleware** cho Gateway API
3. **Implement WebSocket** cho real-time communication
4. **Thêm file upload** functionality
5. **Setup CI/CD pipeline**

## 💡 Tips

- Luôn chạy `./test-setup.sh` trước khi bắt đầu development
- Sử dụng `docker-compose ps` để kiểm tra trạng thái containers
- Mở nhiều terminal để chạy các services song song
- Sử dụng Prisma Studio để debug database issues
- Check logs thường xuyên khi có lỗi

---

**🎉 Chúc bạn coding vui vẻ với Flux!**
