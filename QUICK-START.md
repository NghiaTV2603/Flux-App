# ⚡ Flux - Quick Start (5 phút)

## 🚀 Cách nhanh nhất để chạy Flux

### Bước 1: Yêu cầu

- Docker Desktop đang chạy
- Node.js 20+ (cho development mode và frontend)

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

### Bước 3: Chạy Backend Services (4 terminals)

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

### Bước 4: Chạy Frontend (Terminal 5)

```bash
# Terminal 5 - Frontend React
cd frontend
npm install
cp env.example .env.local
npm run dev
```

## 🎯 URLs quan trọng

### Backend Services

- **Gateway API**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Server Service**: http://localhost:3003

### Frontend & Infrastructure

- **Frontend React**: http://localhost:5173
- **RabbitMQ Management**: http://localhost:15672 (flux_user:flux_password)
- **PostgreSQL**: localhost:5432 (flux_user:flux_password)
- **Redis**: localhost:6379

## 🧪 Test APIs

### Test Backend Services

```bash
# Test Auth Service - Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Test Auth Service - Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test User Service - Health
curl http://localhost:3002/health

# Test Server Service - Health
curl http://localhost:3003/health

# Test Gateway API - Health
curl http://localhost:3000/health
```

### Test Frontend

1. Mở trình duyệt: http://localhost:5173
2. Test register/login form
3. Check developer console cho API calls

## 🛠️ Troubleshooting

### Docker Mode

```bash
# View logs tất cả services
docker-compose logs -f

# View logs service cụ thể
docker-compose logs -f auth-service
docker-compose logs -f gateway-api

# Restart specific service
docker-compose restart auth-service
docker-compose restart user-service
docker-compose restart server-service
docker-compose restart gateway-api

# Test specific service health
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # User
curl http://localhost:3003/health  # Server
curl http://localhost:3000/health  # Gateway

# Rebuild if code changed
docker-compose up -d --build
```

### Development Mode

```bash
# Test setup
./test-setup.sh

# Restart databases
docker-compose restart postgres redis rabbitmq

# Frontend issues
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Common Issues

- **Port conflicts**: Kiểm tra ports 3000-3003, 5173 có bị chiếm không
- **Database connection**: Đợi databases start xong (~30s)
- **Frontend không connect API**: Check VITE_API_URL trong .env.local
- **Services không start**: Check Docker Desktop có đủ RAM không (≥4GB)

## 📊 Monitoring

- **Docker Desktop**: Xem containers, logs, resources
- **Frontend Dev Tools**: http://localhost:5173 → F12 → Network tab
- **RabbitMQ UI**: http://localhost:15672 (flux_user:flux_password)
- **Service Health**: Tự động check mỗi 30s

## 🎯 Development Workflow

1. **Start with Docker**: `./docker-start.sh`
2. **Open Frontend**: http://localhost:5173
3. **Test APIs**: Use curl commands above
4. **Monitor**: Docker Desktop + Browser DevTools
5. **Code changes**: Auto-reload trong development mode

**Với Docker mode, bạn chỉ cần click ▶️ trên Docker Desktop là xong! 🎉**
