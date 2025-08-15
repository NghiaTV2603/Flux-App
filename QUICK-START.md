# ⚡ Flux - Quick Start (5 phút)

## 🚀 Cách nhanh nhất để chạy Flux

### Bước 1: Yêu cầu

- Docker Desktop đang chạy
- Node.js 18+ (chỉ cần cho development mode)

## 🐳 Option 1: Chạy với Docker (Khuyên dùng - Siêu nhanh!)

### Cách 1: Sử dụng Docker Desktop GUI

1. Mở Docker Desktop
2. Vào thư mục project trong terminal: `cd flux-project`
3. Chạy: `./docker-start.sh`
4. Vào Docker Desktop → Containers → Click vào "flux-app" để monitor
5. **Chỉ cần click ▶️ để start/stop toàn bộ project!**

### Cách 2: Command line

```bash
# Build và start toàn bộ project
docker-compose up -d --build

# Stop project
docker-compose down
```

**Xong! Tất cả services sẽ tự động:**

- ✅ Build và start theo đúng thứ tự
- ✅ Setup databases tự động
- ✅ Restart nếu có lỗi
- ✅ Healthcheck tự động

## 🔧 Option 2: Development Mode (Manual)

### Bước 2: Clone và setup

```bash
# Clone project
git clone <repository-url>
cd flux-project

# Setup databases và dependencies
./start.sh dev
```

### Bước 3: Chạy services (4 terminals)

```bash
# Terminal 1 - Auth Service
cd services/auth-service && npm run start:dev

# Terminal 2 - User Service
cd services/user-service && npm run start:dev

# Terminal 3 - Server Service
cd services/server-service && npm run start:dev

# Terminal 4 - Gateway API
cd services/gateway-api && npm run start:dev
```

## 🎯 URLs quan trọng

- **Gateway API**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Server Service**: http://localhost:3003
- **RabbitMQ Management**: http://localhost:15672 (flux_user:flux_password)

## 🧪 Test APIs

```bash
# Test Auth Service
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Test User Service
curl http://localhost:3002/users/search/test

# Test Server Service
curl http://localhost:3003/health

# Test Gateway API
curl http://localhost:3000/health
```

## 🛠️ Troubleshooting

### Docker Mode

```bash
# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart auth-service

# Test specific service
curl http://localhost:3003/health

# Rebuild if code changed
docker-compose up -d --build
```

### Development Mode

```bash
# Test setup
./test-setup.sh

# Restart databases
docker-compose restart postgres mongodb redis rabbitmq
```

## 📊 Monitoring

- **Docker Desktop**: Xem containers, logs, resources
- **RabbitMQ UI**: http://localhost:15672
- **Service Health**: Tự động check mỗi 30s

**Với Docker mode, bạn chỉ cần click ▶️ trên Docker Desktop là xong! 🎉**
