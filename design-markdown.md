# Flux - Thiết kế Hệ thống

## Mục lục

- [Chức năng chính (MVP)](#chức-năng-chính-mvp)
- [Core Features](#core-features)
- [Extended Features](#extended-features)
- [Database](#database)
- [Services](#services)
  - [Auth Service](#auth-service)
  - [User Service](#user-service)
  - [Server Service](#server-service)
  - [Channel Service](#channel-service)
  - [Channel Message Service](#channel-message-service)
  - [Friend Service](#friend-service)
  - [Direct Message Service](#direct-message-service)
  - [File Service](#file-service)
  - [Role Service](#role-service)
  - [Voice Service](#voice-service)
  - [WebSocket Service](#websocket-service)
  - [Notification Service](#notification-service)
  - [Security Service](#security-service)
  - [Gateway API](#gateway-api)
- [System Architecture](#system-architecture)
- [Message Queue Design](#message-queue-design)
- [Tech Stack](#tech-stack)
- [Caching Strategy](#caching-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Alerting](#monitoring--alerting)

## Chức năng chính (MVP)

### Các service

| Service                 | Mô tả                                                       |
| ----------------------- | ----------------------------------------------------------- |
| Auth Service            | Quản lý đăng nhập, đăng ký, OAuth, quên mật khẩu, JWT       |
| User Service            | Lưu trữ thông tin user, avatar, trạng thái online           |
| Server Service          | Tạo server, lưu thông tin server, quản lý thành viên        |
| Channel Service         | Tạo channel text/voice, phân loại public/private, quyền hạn |
| Channel Message Service | Quản lý tin nhắn trong các channel                          |
| Friend Service          | Kết bạn, chấp nhận, block, unfriend                         |
| Direct Message Service  | Quản lý tin nhắn riêng giữa các user                        |
| File Service            | Quản lý upload, lưu trữ và phân phối file/media             |
| Role Service            | Quản lý role và quyền hạn trong server                      |
| Voice Service           | Quản lý kết nối voice, session voice chat                   |
| WebSocket Service       | Quản lý kết nối websocket cho real-time communication       |
| Notification Service    | Gửi email, push notification                                |
| Security Service        | Rate limiting, chống spam, báo cáo vi phạm                  |
| Gateway API             | API Gateway                                                 |

## Core Features

- Auth & User
- Server & Channel
- Friendship & Direct Message
- Real-time Communication
- File Management
- Voice Chat

### Các tính năng cơ bản

- Đăng ký tài khoản
- Đăng nhập tài khoản
- Đăng nhập bằng OAuth (Google, Facebook,...)
- Quên mật khẩu (gửi email reset)
- Quản lý thông tin user (avatar, username,...)
- Tạo server (group/chat room lớn)
- Mời bạn bè vào server bằng mã code
- Tạo các channel trong server (Text Channel / Voice Channel)
- Channel phân loại public / private
- Chỉ user có quyền mới truy cập được channel private
- Kết bạn giữa các user
- Chat trực tiếp giữa 2 user (Direct Message)
- Có thể block / unfriend
- Upload và chia sẻ file/media
- Voice chat trong voice channel
- Real-time thông báo và cập nhật

## Extended Features

- Phân quyền chi tiết trong server
- Emoji và reaction
- Đánh dấu đã đọc/chưa đọc
- Nhắc đến người dùng (@mentions)
- Chống spam và quản lý vi phạm

## Database

### Database cho từng Service

| Service                 | Database đề xuất                 |
| ----------------------- | -------------------------------- |
| Auth Service            | PostgreSQL                       |
| User Service            | PostgreSQL                       |
| Server Service          | PostgreSQL                       |
| Channel Service         | PostgreSQL                       |
| Channel Message Service | MongoDB                          |
| Friend Service          | PostgreSQL                       |
| Direct Message          | MongoDB                          |
| File Service            | PostgreSQL + Object Storage (S3) |
| Role Service            | PostgreSQL                       |
| Voice Service           | Redis + PostgreSQL               |
| Notification Service    | MongoDB                          |
| Security Service        | Redis + PostgreSQL               |

## Services

### Auth Service

**Mô tả**: Quản lý việc đăng ký, đăng nhập, đăng nhập bằng OAuth, quên mật khẩu và refresh token.

#### API Routes:

| Method | Route                 | Mô tả                     |
| ------ | --------------------- | ------------------------- |
| POST   | /auth/register        | Đăng ký tài khoản         |
| POST   | /auth/login           | Đăng nhập tài khoản       |
| POST   | /auth/oauth           | Đăng nhập bằng OAuth      |
| POST   | /auth/forgot-password | Gửi email quên mật khẩu   |
| POST   | /auth/reset-password  | Reset password bằng token |
| POST   | /auth/refresh-token   | Refresh access token      |

#### Database schema

**User**

| Field        | Type      | Ghi chú            |
| ------------ | --------- | ------------------ |
| id           | UUID      | PK                 |
| email        | String    | Unique             |
| username     | String    | Unique             |
| passwordHash | String    | Mã hóa bằng bcrypt |
| createdAt    | Timestamp |                    |
| updatedAt    | Timestamp |                    |

**OAuthProvider**

| Field      | Type   | Ghi chú      |
| ---------- | ------ | ------------ |
| id         | UUID   | PK           |
| userId     | UUID   | FK → User    |
| provider   | String | eg: 'google' |
| providerId | String | ID từ OAuth  |

### User Service

**Mô tả**: Quản lý profile user, avatar, trạng thái online/offline.

#### API Routes:

| Method | Route             | Mô tả                 |
| ------ | ----------------- | --------------------- |
| GET    | /users/:id        | Lấy thông tin user    |
| PATCH  | /users/:id        | Cập nhật thông tin    |
| GET    | /users/status/:id | Lấy trạng thái online |
| GET    | /users/search     | Tìm kiếm user         |

#### Database schema

**UserProfile**

| Field        | Type         | Ghi chú                      |
| ------------ | ------------ | ---------------------------- |
| id           | UUID         | PK                           |
| username     | String       |                              |
| avatar       | String (URL) |                              |
| status       | String       | online / offline / invisible |
| customStatus | String       | Status message tùy chỉnh     |
| createdAt    | Timestamp    |                              |
| updatedAt    | Timestamp    |                              |

### Server Service

**Mô tả**: Tạo và quản lý server, thành viên trong server.

#### API Routes:

| Method | Route                        | Mô tả                         |
| ------ | ---------------------------- | ----------------------------- |
| POST   | /servers                     | Tạo server                    |
| GET    | /servers/:id                 | Lấy info server               |
| PATCH  | /servers/:id                 | Cập nhật thông tin server     |
| DELETE | /servers/:id                 | Xóa server                    |
| POST   | /servers/:id/join            | Tham gia server bằng code     |
| POST   | /servers/:id/invite          | Tạo invite code               |
| GET    | /servers/:id/members         | Lấy danh sách thành viên      |
| PATCH  | /servers/:id/members/:userId | Cập nhật thông tin thành viên |
| DELETE | /servers/:id/members/:userId | Kick thành viên               |

#### Database schema

**Server**

| Field       | Type      | Ghi chú     |
| ----------- | --------- | ----------- |
| id          | UUID      | PK          |
| name        | String    |             |
| description | String    |             |
| icon        | String    | URL to icon |
| ownerId     | UUID      | FK → User   |
| inviteCode  | String    | Unique      |
| createdAt   | Timestamp |             |
| updatedAt   | Timestamp |             |

**ServerMember**

| Field    | Type      | Ghi chú                |
| -------- | --------- | ---------------------- |
| id       | UUID      | PK                     |
| serverId | UUID      | FK → Server            |
| userId   | UUID      | FK → User              |
| nickname | String    | Nickname trong server  |
| role     | String    | owner / admin / member |
| joinedAt | Timestamp |                        |

### Channel Service

**Mô tả**: Tạo và quản lý channel text/voice trong server.

#### API Routes:

| Method | Route                     | Mô tả                      |
| ------ | ------------------------- | -------------------------- |
| POST   | /servers/:id/channels     | Tạo channel mới            |
| GET    | /servers/:id/channels     | Lấy danh sách channel      |
| GET    | /channels/:id             | Lấy thông tin channel      |
| PATCH  | /channels/:id             | Cập nhật thông tin channel |
| DELETE | /channels/:id             | Xóa channel                |
| POST   | /channels/:id/permissions | Cập nhật quyền hạn         |

#### Database schema

**Channel**

| Field       | Type      | Ghi chú      |
| ----------- | --------- | ------------ |
| id          | UUID      | PK           |
| serverId    | UUID      | FK → Server  |
| name        | String    |              |
| description | String    |              |
| type        | String    | text / voice |
| isPrivate   | Boolean   |              |
| createdAt   | Timestamp |              |
| updatedAt   | Timestamp |              |

**ChannelMember**

| Field     | Type      | Ghi chú                |
| --------- | --------- | ---------------------- |
| id        | UUID      | PK                     |
| channelId | UUID      | FK → Channel           |
| userId    | UUID      | FK → User              |
| lastRead  | Timestamp | Thời điểm đọc gần nhất |

### Channel Message Service

**Mô tả**: Quản lý tin nhắn trong các channel của server.

#### API Routes:

| Method | Route                                       | Mô tả                                 |
| ------ | ------------------------------------------- | ------------------------------------- |
| POST   | /channels/:channelId/messages               | Gửi tin nhắn vào channel              |
| GET    | /channels/:channelId/messages               | Lấy lịch sử tin nhắn (với pagination) |
| DELETE | /channels/:channelId/messages/:id           | Xóa tin nhắn                          |
| PATCH  | /channels/:channelId/messages/:id           | Sửa tin nhắn                          |
| POST   | /channels/:channelId/messages/:id/reactions | Thêm reaction                         |
| DELETE | /channels/:channelId/messages/:id/reactions | Xóa reaction                          |

#### Database schema

**ChannelMessage**

| Field       | Type      | Ghi chú                        |
| ----------- | --------- | ------------------------------ |
| id          | UUID      | PK                             |
| channelId   | UUID      | FK → Channel                   |
| userId      | UUID      | FK → User                      |
| content     | String    |                                |
| attachments | JSON      | URL của file/hình ảnh đính kèm |
| mentions    | JSON      | Danh sách user được nhắc đến   |
| createdAt   | Timestamp |                                |
| updatedAt   | Timestamp |                                |

**MessageReaction**

| Field     | Type      | Ghi chú             |
| --------- | --------- | ------------------- |
| id        | UUID      | PK                  |
| messageId | UUID      | FK → ChannelMessage |
| userId    | UUID      | FK → User           |
| emoji     | String    | Emoji code          |
| createdAt | Timestamp |                     |

### Friend Service

**Mô tả**: Quản lý kết bạn, block, unfriend.

#### API Routes:

| Method | Route            | Mô tả                          |
| ------ | ---------------- | ------------------------------ |
| POST   | /friends/request | Gửi lời mời kết bạn            |
| POST   | /friends/accept  | Chấp nhận lời mời              |
| POST   | /friends/block   | Block user                     |
| DELETE | /friends/remove  | Xóa bạn                        |
| GET    | /friends         | Lấy danh sách bạn              |
| GET    | /friends/pending | Lấy danh sách lời mời đang chờ |
| GET    | /friends/blocked | Lấy danh sách user đã block    |

#### Database schema

**Friendship**

| Field       | Type      | Ghi chú                      |
| ----------- | --------- | ---------------------------- |
| id          | UUID      | PK                           |
| requesterId | UUID      | FK → User                    |
| receiverId  | UUID      | FK → User                    |
| status      | String    | pending / accepted / blocked |
| createdAt   | Timestamp |                              |
| updatedAt   | Timestamp |                              |

### Direct Message Service

**Mô tả**: Chat trực tiếp giữa 2 user.

#### API Routes:

| Method | Route                    | Mô tả            |
| ------ | ------------------------ | ---------------- |
| POST   | /dm/send                 | Gửi tin nhắn     |
| GET    | /dm/conversation/:userId | Lấy lịch sử chat |
| DELETE | /dm/messages/:id         | Xóa tin nhắn     |
| PATCH  | /dm/messages/:id         | Sửa tin nhắn     |

#### Database schema

**DirectMessage**

| Field       | Type      | Ghi chú                        |
| ----------- | --------- | ------------------------------ |
| id          | UUID      | PK                             |
| senderId    | UUID      | FK → User                      |
| receiverId  | UUID      | FK → User                      |
| content     | String    |                                |
| attachments | JSON      | URL của file/hình ảnh đính kèm |
| isRead      | Boolean   | Đã đọc chưa                    |
| sentAt      | Timestamp |                                |
| readAt      | Timestamp | Thời điểm đọc                  |

### File Service

**Mô tả**: Quản lý tải lên, lưu trữ và phân phối file.

#### API Routes:

| Method | Route               | Mô tả                       |
| ------ | ------------------- | --------------------------- |
| POST   | /files/upload       | Tải file lên                |
| GET    | /files/:id          | Lấy thông tin file          |
| DELETE | /files/:id          | Xóa file                    |
| GET    | /files/user/:userId | Lấy danh sách file của user |

#### Database schema

**File**

| Field        | Type      | Ghi chú                         |
| ------------ | --------- | ------------------------------- |
| id           | UUID      | PK                              |
| uploaderId   | UUID      | FK → User                       |
| fileName     | String    |                                 |
| fileType     | String    | MIME type                       |
| fileSize     | Number    | Kích thước (bytes)              |
| fileUrl      | String    | URL tới cloud storage           |
| thumbnailUrl | String    | URL thumbnail (nếu là hình ảnh) |
| uploadedAt   | Timestamp |                                 |

### Role Service

**Mô tả**: Quản lý role và quyền hạn trong server.

#### API Routes:

| Method | Route                                      | Mô tả                   |
| ------ | ------------------------------------------ | ----------------------- |
| POST   | /servers/:id/roles                         | Tạo role mới            |
| GET    | /servers/:id/roles                         | Lấy danh sách role      |
| PATCH  | /servers/:id/roles/:roleId                 | Cập nhật quyền cho role |
| DELETE | /servers/:id/roles/:roleId                 | Xóa role                |
| POST   | /servers/:id/members/:userId/roles/:roleId | Gắn role cho user       |
| DELETE | /servers/:id/members/:userId/roles/:roleId | Gỡ role khỏi user       |

#### Database schema

**Role**

| Field     | Type      | Ghi chú        |
| --------- | --------- | -------------- |
| id        | UUID      | PK             |
| serverId  | UUID      | FK → Server    |
| name      | String    |                |
| color     | String    | Mã màu (hex)   |
| position  | Number    | Thứ tự ưu tiên |
| createdAt | Timestamp |                |
| updatedAt | Timestamp |                |

**Permission**

| Field   | Type    | Ghi chú                                            |
| ------- | ------- | -------------------------------------------------- |
| id      | UUID    | PK                                                 |
| roleId  | UUID    | FK → Role                                          |
| action  | String  | Loại quyền (e.g. 'manage_channel', 'send_message') |
| allowed | Boolean | true/false                                         |

**UserRole**

| Field      | Type      | Ghi chú   |
| ---------- | --------- | --------- |
| id         | UUID      | PK        |
| userId     | UUID      | FK → User |
| roleId     | UUID      | FK → Role |
| assignedAt | Timestamp |           |

### Voice Service

**Mô tả**: Quản lý kết nối voice, session voice chat.

#### API Routes:

| Method | Route                                    | Mô tả                                       |
| ------ | ---------------------------------------- | ------------------------------------------- |
| POST   | /voice/channels/:id/join                 | Tham gia voice channel                      |
| POST   | /voice/channels/:id/leave                | Rời voice channel                           |
| GET    | /voice/channels/:id/users                | Lấy danh sách user đang trong voice channel |
| PATCH  | /voice/channels/:id/users/:userId/mute   | Mute/unmute user                            |
| PATCH  | /voice/channels/:id/users/:userId/deafen | Deafen/undeafen user                        |

#### Database schema

**VoiceSession**

| Field      | Type      | Ghi chú                     |
| ---------- | --------- | --------------------------- |
| id         | UUID      | PK                          |
| channelId  | UUID      | FK → Channel                |
| userId     | UUID      | FK → User                   |
| isMuted    | Boolean   |                             |
| isDeafened | Boolean   |                             |
| joinedAt   | Timestamp |                             |
| leftAt     | Timestamp | Null khi đang trong session |

### WebSocket Service

**Mô tả**: Quản lý kết nối websocket, đảm bảo real-time communication giữa các user.

#### API Routes:

| Method | Route       | Mô tả                       |
| ------ | ----------- | --------------------------- |
| GET    | /ws/connect | Thiết lập kết nối WebSocket |

#### Các event WebSocket:

- `user.status.changed`: Khi user thay đổi trạng thái online/offline
- `message.created`: Khi có tin nhắn mới
- `message.updated`: Khi tin nhắn được cập nhật
- `message.deleted`: Khi tin nhắn bị xóa
- `channel.created`: Khi channel được tạo
- `channel.updated`: Khi channel được cập nhật
- `channel.deleted`: Khi channel bị xóa
- `voice.user.joined`: Khi user tham gia voice channel
- `voice.user.left`: Khi user rời voice channel
- `server.member.joined`: Khi có thành viên mới tham gia server
- `server.member.left`: Khi thành viên rời server
- `friend.request.received`: Khi nhận được lời mời kết bạn
- `friend.request.accepted`: Khi lời mời kết bạn được chấp nhận

### Notification Service

**Mô tả**: Gửi email, push notification khi có lời mời, tin nhắn mới.

#### API Routes:

| Method | Route                   | Mô tả                      |
| ------ | ----------------------- | -------------------------- |
| GET    | /notifications          | Lấy danh sách thông báo    |
| PATCH  | /notifications/:id/read | Đánh dấu đã đọc            |
| POST   | /notifications/settings | Cập nhật cài đặt thông báo |
| DELETE | /notifications/:id      | Xóa thông báo              |

#### Database Schema

**Notification**

| Field         | Type      | Ghi chú                                            |
| ------------- | --------- | -------------------------------------------------- |
| id            | UUID      | PK                                                 |
| userId        | UUID      | FK → User                                          |
| type          | String    | 'friend_request', 'message', 'mention', etc.       |
| content       | String    | Nội dung thông báo                                 |
| referenceId   | UUID      | ID của đối tượng liên quan (tin nhắn, lời mời,...) |
| referenceType | String    | Loại đối tượng liên quan                           |
| isRead        | Boolean   |                                                    |
| createdAt     | Timestamp |                                                    |

**NotificationSetting**

| Field            | Type    | Ghi chú                   |
| ---------------- | ------- | ------------------------- |
| id               | UUID    | PK                        |
| userId           | UUID    | FK → User                 |
| notificationType | String  | Loại thông báo            |
| enabled          | Boolean | Bật/tắt thông báo         |
| emailEnabled     | Boolean | Bật/tắt gửi email         |
| pushEnabled      | Boolean | Bật/tắt push notification |

### Security Service

**Mô tả**: Quản lý rate limiting, phát hiện spam, xử lý báo cáo vi phạm.

#### API Routes:

| Method | Route                 | Mô tả                          |
| ------ | --------------------- | ------------------------------ |
| POST   | /reports              | Báo cáo vi phạm                |
| GET    | /reports/user/:userId | Lấy danh sách báo cáo của user |
| GET    | /ratelimits           | Kiểm tra trạng thái rate limit |
| POST   | /security/validate    | Validate các yêu cầu đáng ngờ  |

#### Database Schema

**Report**

| Field      | Type      | Ghi chú                           |
| ---------- | --------- | --------------------------------- |
| id         | UUID      | PK                                |
| reporterId | UUID      | FK → User                         |
| targetId   | UUID      | ID của đối tượng bị báo cáo       |
| targetType | String    | 'user', 'message', 'server'       |
| reason     | String    | Lý do báo cáo                     |
| status     | String    | 'pending', 'reviewed', 'resolved' |
| createdAt  | Timestamp |                                   |
| resolvedAt | Timestamp |                                   |

**RateLimit**

| Field     | Type      | Ghi chú               |
| --------- | --------- | --------------------- |
| id        | UUID      | PK                    |
| userId    | UUID      | FK → User             |
| ipAddress | String    |                       |
| endpoint  | String    | API endpoint          |
| count     | Number    | Số lần gọi            |
| window    | Timestamp | Thời gian bắt đầu đếm |
| expiresAt | Timestamp |                       |

### Gateway API

**Mô tả**: Điểm vào duy nhất cho client, định tuyến request đến các service.

#### Chức năng:

- Authentication middleware
- Request routing
- Response caching
- Rate limiting
- Logging
- Circuit breaking

## System Architecture

```
+-------------+
| Client App  | Web / Mobile App
+------+------+
       |
+------v------+
| API Gateway | Gateway / Load Balancer / Authentication
+------+------+
       |
+------+------+------+------+------+------+------+------+
|      |      |      |      |      |      |      |      |
v      v      v      v      v      v      v      v      v
AuthSvc UserSvc ServerSvc ChannelSvc MsgSvc FileSvc RoleSvc VoiceSvc
|
+------+------+------+                        |
|      |      |      |                        |
v      v      v      v                        v
FriendSvc DMSvc SecSvc WebSocketSvc           NotifySvc
                                              |
                                              v
```

## Message Queue Design

### RabbitMQ

**Exchange**: `app.events` (type: topic)

**Queue**:

- `notification.queue`
- `server.queue`
- `friend.queue`
- `dm.queue`

### Các event chính:

- `user.created`
- `user.status.changed`
- `friend.requested`
- `friend.accepted`
- `server.created`
- `server.member.joined`
- `server.member.left`
- `message.direct.sent`
- `message.channel.sent`
- `message.edited`
- `message.deleted`
- `channel.created`
- `channel.updated`
- `voice.session.started`
- `voice.session.ended`
- `notification.created`
- `file.uploaded`
- `role.assigned`

## Tech Stack

### Backend:

- Node.js + TypeScript
- Nestjs framework
- PostgreSQL, MongoDB, Redis
- Prisma
- RabbitMQ
- WebSocket (Socket.io)

### Infrastructure:

- Docker + Kubernetes
- CI/CD: GitHub Actions

### Security:

- JWT Authentication
- HTTPS
- CORS
- Input validation
- Rate limiting
- SQL Injection prevention

### Storage:

- S3 cho file storage
- Redis cho caching
- PostgreSQL cho dữ liệu quan hệ
- MongoDB cho dữ liệu dạng document

## Caching Strategy

### Dữ liệu nên cache trong Redis:

- User sessions và JWT blacklist
- User profile và status
- Danh sách server và channel
- Role permissions
- Rate limiting counters
- Danh sách người dùng online trong channel
- Tin nhắn gần đây
- Friend lists

### TTL:

- User sessions: 30 phút hoặc 1 giờ
- User profile: 15 phút
- Server và channel lists: 10 phút
- Tin nhắn gần đây: 5 phút

## CI/CD Pipeline

1. Code Push → GitHub/GitLab
2. Run Linter → ESLint + Prettier
3. Run Tests → Jest/Vitest
4. Build Docker Images → Docker
5. Push to Container Registry → Docker Hub/ECR
6. Deploy to Staging → K8s
7. Run E2E Tests → Cypress/Playwright
8. Deploy to Production → K8s
