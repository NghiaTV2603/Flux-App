# Flux API Gateway

API Gateway cho hệ thống Flux - điểm vào duy nhất cho tất cả các microservices.

## Tính năng

- **Authentication & Authorization**: Xác thực JWT và quản lý session
- **Rate Limiting**: Giới hạn số lượng request theo endpoint và user
- **Request Routing**: Định tuyến request đến các microservice tương ứng
- **Response Caching**: Cache response để tăng hiệu suất
- **Logging**: Ghi log tất cả request/response
- **CORS**: Cấu hình CORS cho frontend
- **Circuit Breaking**: Xử lý lỗi khi microservice không khả dụng

## Cấu trúc

```
src/
├── config/             # Cấu hình ứng dụng
├── controllers/        # Controllers cho từng service
├── guards/            # Guards cho authentication và rate limiting
├── redis/             # Redis service cho caching
├── services/          # HTTP client service
└── main.ts           # Entry point
```

## Cài đặt

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run start:dev
```

## Biến môi trường

```env
# Server Configuration
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Microservices URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SERVER_SERVICE_URL=http://localhost:3003
CHANNEL_SERVICE_URL=http://localhost:3004
MESSAGE_SERVICE_URL=http://localhost:3005
FRIEND_SERVICE_URL=http://localhost:3006
DM_SERVICE_URL=http://localhost:3007
FILE_SERVICE_URL=http://localhost:3008
ROLE_SERVICE_URL=http://localhost:3009
VOICE_SERVICE_URL=http://localhost:3010
NOTIFICATION_SERVICE_URL=http://localhost:3011
SECURITY_SERVICE_URL=http://localhost:3012
ANALYTICS_SERVICE_URL=http://localhost:3013
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu
- `POST /api/auth/refresh-token` - Refresh token

### Users

- `GET /api/users/:id` - Lấy thông tin user
- `PATCH /api/users/:id` - Cập nhật thông tin user
- `GET /api/users/status/:id` - Lấy trạng thái online
- `GET /api/users` - Tìm kiếm user

### Servers

- `POST /api/servers` - Tạo server
- `GET /api/servers/:id` - Lấy thông tin server
- `PATCH /api/servers/:id` - Cập nhật server
- `DELETE /api/servers/:id` - Xóa server
- `POST /api/servers/:id/join` - Tham gia server
- `POST /api/servers/:id/invite` - Tạo mã mời
- `GET /api/servers/:id/members` - Lấy danh sách thành viên
- `POST /api/servers/:id/channels` - Tạo channel

### Channels

- `GET /api/channels/:id` - Lấy thông tin channel
- `PATCH /api/channels/:id` - Cập nhật channel
- `DELETE /api/channels/:id` - Xóa channel
- `POST /api/channels/:channelId/messages` - Gửi tin nhắn
- `GET /api/channels/:channelId/messages` - Lấy lịch sử tin nhắn

### Friends

- `POST /api/friends/request` - Gửi lời mời kết bạn
- `POST /api/friends/accept` - Chấp nhận lời mời
- `POST /api/friends/block` - Block user
- `DELETE /api/friends/remove` - Xóa bạn
- `GET /api/friends` - Lấy danh sách bạn

### Direct Messages

- `POST /api/dm/send` - Gửi tin nhắn riêng
- `GET /api/dm/conversation/:userId` - Lấy cuộc trò chuyện
- `DELETE /api/dm/messages/:id` - Xóa tin nhắn
- `PATCH /api/dm/messages/:id` - Sửa tin nhắn

## Rate Limiting

API Gateway áp dụng rate limiting cho các endpoint:

- **Auth endpoints**: 3-10 requests/15 phút
- **Message endpoints**: 30-50 messages/phút
- **General endpoints**: 50-200 requests/phút

## Development

```bash
# Start in development mode
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm test

# Run linter
npm run lint
```

## Docker

```bash
# Build image
docker build -t flux-gateway .

# Run container
docker run -p 3000:3000 --env-file .env flux-gateway
```

## Monitoring

Gateway tự động log tất cả requests và có thể tích hợp với:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Centralized logging
- **Jaeger**: Distributed tracing
