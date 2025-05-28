# 📁 Flux Project - Tổng quan Files

## 📖 Files Hướng dẫn

| File                                         | Mô tả                               | Khi nào sử dụng                             |
| -------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| **[QUICK-START.md](QUICK-START.md)**         | Hướng dẫn chạy project trong 5 phút | Muốn chạy nhanh, đã quen với Docker/Node.js |
| **[GETTING-STARTED.md](GETTING-STARTED.md)** | Hướng dẫn chi tiết từng bước        | Lần đầu setup, muốn hiểu rõ từng bước       |
| **[README.md](README.md)**                   | Tổng quan project và API docs       | Tìm hiểu về project, xem API endpoints      |
| **[SETUP-FIXES.md](SETUP-FIXES.md)**         | Tóm tắt các lỗi đã sửa              | Debug khi gặp lỗi tương tự                  |
| **[design-markdown.md](design-markdown.md)** | Thiết kế hệ thống chi tiết          | Hiểu kiến trúc, database design             |

## 🚀 Scripts Tự động

| Script                             | Mô tả                    | Cách sử dụng                       |
| ---------------------------------- | ------------------------ | ---------------------------------- |
| **[start.sh](start.sh)**           | Script khởi động project | `./start.sh dev` hoặc `./start.sh` |
| **[test-setup.sh](test-setup.sh)** | Test toàn bộ setup       | `./test-setup.sh`                  |

## 🧪 Testing & API

| File                               | Mô tả              | Cách sử dụng                               |
| ---------------------------------- | ------------------ | ------------------------------------------ |
| **[test-api.http](test-api.http)** | Test API endpoints | Mở trong VS Code với REST Client extension |

## 🐳 Infrastructure

| File                                                     | Mô tả                      | Chức năng                       |
| -------------------------------------------------------- | -------------------------- | ------------------------------- |
| **[docker-compose.yml](docker-compose.yml)**             | Cấu hình Docker services   | Khởi động databases và services |
| **[docker/postgres/init.sql](docker/postgres/init.sql)** | Script khởi tạo PostgreSQL | Tạo databases cho từng service  |

## 🔧 Services

### Auth Service (`services/auth-service/`)

```
├── prisma/
│   └── schema.prisma          # Database schema cho auth
├── src/
│   ├── auth/
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── auth.controller.ts # API endpoints
│   │   ├── auth.service.ts   # Business logic
│   │   └── auth.module.ts    # Module configuration
│   ├── config/
│   │   └── configuration.ts  # Environment config
│   ├── prisma/
│   │   └── prisma.service.ts # Database service
│   ├── app.module.ts         # Main app module
│   └── main.ts              # Application entry point
├── .env                     # Environment variables
├── package.json             # Dependencies
└── Dockerfile              # Docker configuration
```

### User Service (`services/user-service/`)

```
├── prisma/
│   └── schema.prisma          # Database schema cho users
├── src/
│   ├── user/
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── user.controller.ts # API endpoints
│   │   ├── user.service.ts   # Business logic
│   │   └── user.module.ts    # Module configuration
│   ├── config/
│   │   └── configuration.ts  # Environment config
│   ├── prisma/
│   │   └── prisma.service.ts # Database service
│   ├── app.module.ts         # Main app module
│   └── main.ts              # Application entry point
├── .env                     # Environment variables
├── package.json             # Dependencies
└── Dockerfile              # Docker configuration
```

### Gateway API (`services/gateway-api/`)

```
├── src/
│   ├── app.module.ts         # Main app module
│   └── main.ts              # Application entry point
├── package.json             # Dependencies
└── Dockerfile              # Docker configuration
```

## 🗄️ Database Schemas

### Auth Service Database (`flux_auth_db`)

- **users** - Thông tin đăng nhập
- **oauth_providers** - OAuth providers (Google, Facebook)
- **refresh_tokens** - JWT refresh tokens
- **password_resets** - Password reset tokens

### User Service Database (`flux_user_db`)

- **user_profiles** - Profile thông tin user
- **user_settings** - Cài đặt user
- **user_activities** - Hoạt động user

## 🔗 API Endpoints

### Auth Service (Port 3001)

- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/reset-password` - Reset mật khẩu
- `POST /auth/refresh-token` - Refresh token

### User Service (Port 3002)

- `GET /users/:id` - Lấy profile user
- `PATCH /users/:id` - Cập nhật profile
- `PATCH /users/:id/status` - Cập nhật status
- `GET /users/search/:query` - Tìm kiếm user

### Gateway API (Port 3000)

- Sẽ route requests đến các services tương ứng

## 🌐 Infrastructure URLs

| Service             | URL                    | Credentials             |
| ------------------- | ---------------------- | ----------------------- |
| Auth Service        | http://localhost:3001  | -                       |
| User Service        | http://localhost:3002  | -                       |
| Gateway API         | http://localhost:3000  | -                       |
| PostgreSQL          | localhost:5432         | flux_user:flux_password |
| MongoDB             | localhost:27017        | flux_user:flux_password |
| Redis               | localhost:6379         | -                       |
| RabbitMQ            | localhost:5672         | flux_user:flux_password |
| RabbitMQ Management | http://localhost:15672 | flux_user:flux_password |

## 📋 Development Workflow

1. **Setup lần đầu**: Đọc `GETTING-STARTED.md`
2. **Chạy nhanh**: Sử dụng `QUICK-START.md`
3. **Test setup**: Chạy `./test-setup.sh`
4. **Development**: Chạy `./start.sh dev`
5. **Test APIs**: Sử dụng `test-api.http`
6. **Debug**: Xem logs, sử dụng Prisma Studio
7. **Troubleshoot**: Tham khảo `SETUP-FIXES.md`

## 🎯 Next Development

Các files sẽ được thêm khi phát triển tiếp:

- `services/server-service/` - Quản lý servers/groups
- `services/channel-service/` - Quản lý channels
- `services/message-service/` - Xử lý tin nhắn
- `services/websocket-service/` - Real-time communication
- `services/file-service/` - Upload/download files

---

**💡 Tip**: Bookmark file này để nhanh chóng tìm thấy file cần thiết!
