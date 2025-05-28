# ⚡ Flux - Quick Start (5 phút)

## 🚀 Cách nhanh nhất để chạy Flux

### Bước 1: Yêu cầu

- Docker Desktop đang chạy
- Node.js 18+

### Bước 2: Clone và chạy

```bash
# Clone project
git clone <repository-url>
cd flux-project

# Chạy script tự động
./start.sh dev
```

**Xong! Script sẽ tự động:**

- ✅ Khởi động databases (PostgreSQL, MongoDB, Redis, RabbitMQ)
- ✅ Cài đặt dependencies cho tất cả services
- ✅ Setup databases với Prisma
- ✅ Hướng dẫn chạy services

### Bước 3: Chạy services (3 terminals)

```bash
# Terminal 1 - Auth Service
cd services/auth-service && npm run start:dev

# Terminal 2 - User Service
cd services/user-service && npm run start:dev

# Terminal 3 - Gateway API
cd services/gateway-api && npm run start:dev
```

### Bước 4: Test APIs

```bash
# Test Auth Service
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Test User Service
curl http://localhost:3002/users/search/test
```

## 🎯 URLs quan trọng

- **Auth Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Gateway API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (flux_user:flux_password)

## 🛠️ Nếu có lỗi

```bash
# Test toàn bộ setup
./test-setup.sh

# Restart databases
docker-compose restart postgres mongodb redis rabbitmq
```

**Xem file `GETTING-STARTED.md` để có hướng dẫn chi tiết hơn!**
