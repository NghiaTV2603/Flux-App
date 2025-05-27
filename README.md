# Flux - Hệ thống Chat Microservices

Flux là một hệ thống chat real-time được xây dựng với kiến trúc microservices sử dụng NestJS, PostgreSQL, MongoDB, Redis và RabbitMQ.

## Kiến trúc

- **Auth Service** (Port 3001): Xử lý đăng ký, đăng nhập, JWT tokens
- **User Service** (Port 3002): Quản lý thông tin user, profile
- **Gateway API** (Port 3000): API Gateway, routing requests
- **PostgreSQL** (Port 5432): Database chính
- **MongoDB** (Port 27017): Database cho messages
- **Redis** (Port 6379): Cache và sessions
- **RabbitMQ** (Port 5672, Management 15672): Message queue

## Yêu cầu

- Docker & Docker Compose
- Node.js 18+ (để development)
- npm hoặc yarn

## 🚀 Bắt đầu nhanh

### 📖 Hướng dẫn chi tiết

- **[QUICK-START.md](QUICK-START.md)** - Chạy project trong 5 phút ⚡
- **[GETTING-STARTED.md](GETTING-STARTED.md)** - Hướng dẫn từng bước chi tiết 📚

### ⚡ Quick Start

```bash
git clone <repository-url>
cd flux-project
./start.sh dev
```

## Cài đặt và Chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd flux-project
```

### 2. Chạy với Docker Compose

```bash
# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### 3. Development Mode

Nếu muốn chạy development mode:

```bash
# Chỉ chạy databases
docker-compose up -d postgres mongodb redis rabbitmq

# Cài đặt dependencies cho từng service
cd services/auth-service && npm install
cd ../user-service && npm install
cd ../gateway-api && npm install

# Chạy migrations
cd services/auth-service && npx prisma migrate dev
cd ../user-service && npx prisma migrate dev

# Chạy services
cd services/auth-service && npm run start:dev
cd services/user-service && npm run start:dev
cd services/gateway-api && npm run start:dev
```

## API Endpoints

### Auth Service (http://localhost:3001)

- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/reset-password` - Reset mật khẩu
- `POST /auth/refresh-token` - Refresh token

### Gateway API (http://localhost:3000)

- Tất cả requests sẽ được route qua Gateway API
- Gateway sẽ forward requests đến các services tương ứng

## Database

### PostgreSQL Databases

- `flux_auth_db` - Auth Service
- `flux_user_db` - User Service
- `flux_server_db` - Server Service (future)
- `flux_channel_db` - Channel Service (future)
- `flux_friend_db` - Friend Service (future)
- `flux_file_db` - File Service (future)
- `flux_role_db` - Role Service (future)
- `flux_voice_db` - Voice Service (future)
- `flux_security_db` - Security Service (future)

### Credentials

- **PostgreSQL**: `flux_user:flux_password`
- **MongoDB**: `flux_user:flux_password`
- **RabbitMQ**: `flux_user:flux_password`

## Management UIs

- **RabbitMQ Management**: http://localhost:15672
- **Prisma Studio**: `npx prisma studio` (trong thư mục service)

## Environment Variables

Các biến môi trường được cấu hình trong `docker-compose.yml`. Để development, có thể tạo file `.env` trong mỗi service.

## Cấu trúc Project

```
flux-project/
├── services/
│   ├── auth-service/          # Authentication service
│   ├── user-service/          # User management service
│   └── gateway-api/           # API Gateway
├── docker/
│   └── postgres/
│       └── init.sql           # Database initialization
├── docker-compose.yml         # Docker services configuration
└── README.md
```

## Phát triển tiếp

Các service sẽ được triển khai tiếp theo:

1. Server Service - Quản lý servers/groups
2. Channel Service - Quản lý channels
3. Message Service - Xử lý tin nhắn
4. Friend Service - Quản lý bạn bè
5. File Service - Upload/download files
6. Voice Service - Voice chat
7. WebSocket Service - Real-time communication

## Troubleshooting

### Lỗi kết nối database

```bash
# Kiểm tra containers đang chạy
docker-compose ps

# Restart services
docker-compose restart postgres

# Xem logs
docker-compose logs postgres
```

### Lỗi Prisma

```bash
# Generate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset

# Push schema
npx prisma db push
```
# Flux-App
