# Flux - Thiết kế Hệ thống

## Mục lục

- [Chức năng chính (MVP)](#chức-năng-chính-mvp)
- [Core Features](#core-features)
- [Extended Features](#extended-features)
- [Database](#database)
- [Services](#services)
  - [Auth Service](#auth-service)
  - [User & Social Service](#user--social-service)
  - [Server & Channel Service](#server--channel-service)
  - [Message Service](#message-service)
  - [Media & File Service](#media--file-service)
  - [Realtime Service](#realtime-service)
  - [Gateway API](#gateway-api)
- [System Architecture](#system-architecture)
- [Message Queue Design](#message-queue-design)
- [Tech Stack](#tech-stack)
- [Caching Strategy](#caching-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Alerting](#monitoring--alerting)

## Chức năng chính (MVP)

### Các service (Tối ưu hóa - 6 services)

| Service                  | Mô tả                                                 |
| ------------------------ | ----------------------------------------------------- |
| Auth Service             | Quản lý đăng nhập, đăng ký, OAuth, quên mật khẩu, JWT |
| User & Social Service    | User profiles, friends, blocking, social features     |
| Server & Channel Service | Servers, channels, roles, permissions, members        |
| Message Service          | Tất cả tin nhắn (channel + DM), threads, reactions    |
| Media & File Service     | Upload, lưu trữ, CDN, file sharing, avatars           |
| Realtime Service         | WebSocket, voice calls, screen share, notifications   |
| Gateway API              | API Gateway với rate limiting và security             |

## Core Features

- Auth & User
- Server & Channel
- Friendship & Direct Message
- Real-time Communication
- File Management
- Voice Chat

### Các tính năng cơ bản (Discord-like)

**Authentication & User Management:**

- Đăng ký/đăng nhập tài khoản với email/password
- Đăng nhập OAuth (Google, Discord, GitHub)
- User profiles với avatar, bio, status
- Online/offline/busy/away status
- Custom status messages

**Social Features:**

- Gửi/nhận friend requests
- Friends list với online status
- Block/unblock users
- Direct messages giữa friends

**Server & Channel Management:**

- Tạo servers (Discord guilds)
- Invite system với invite codes/links
- Text channels và Voice channels
- Channel categories để organize
- Private channels với permissions
- Role-based permissions system
- Channel-specific permissions

**Messaging & Communication:**

- Real-time text chat trong channels
- Direct messages
- Message reactions (emoji)
- Message threads/replies
- File/image sharing
- @mentions (users, roles, everyone)
- Message history và search

**Voice & Video:**

- Voice calls trong voice channels
- Group voice calls (multiple users)
- Screen sharing trong voice calls
- Push-to-talk và voice activation
- Mute/deafen controls

**Real-time Features:**

- Live typing indicators
- Message delivery status
- Real-time member list updates
- Voice channel member indicators

## Extended Features

### Discord-like Permissions System

**Server Permissions (bitfield):**

- `ADMINISTRATOR` - Full admin access
- `MANAGE_GUILD` - Manage server settings
- `MANAGE_ROLES` - Create/edit/delete roles
- `MANAGE_CHANNELS` - Create/edit/delete channels
- `KICK_MEMBERS` - Kick members from server
- `BAN_MEMBERS` - Ban members from server
- `CREATE_INSTANT_INVITE` - Create invite links
- `CHANGE_NICKNAME` - Change own nickname
- `MANAGE_NICKNAMES` - Manage others' nicknames
- `MANAGE_EMOJIS` - Add/remove custom emojis
- `VIEW_AUDIT_LOG` - View server audit logs

**Channel Permissions (bitfield):**

- `VIEW_CHANNEL` - See the channel
- `SEND_MESSAGES` - Send messages in text channels
- `EMBED_LINKS` - Embed links in messages
- `ATTACH_FILES` - Upload files and media
- `READ_MESSAGE_HISTORY` - Read message history
- `MENTION_EVERYONE` - Use @everyone and @here
- `ADD_REACTIONS` - Add emoji reactions
- `CONNECT` - Connect to voice channels
- `SPEAK` - Speak in voice channels
- `MUTE_MEMBERS` - Mute members in voice
- `DEAFEN_MEMBERS` - Deafen members in voice
- `MOVE_MEMBERS` - Move members between voice channels
- `USE_VOICE_ACTIVITY` - Use voice activity detection
- `PRIORITY_SPEAKER` - Priority speaker in voice
- `STREAM` - Screen share in voice channels

**Permission Hierarchy:**

1. Server Owner - All permissions
2. Administrator role - Bypasses all channel permissions
3. Role permissions - Combined with bitwise OR
4. Channel overwrites - Can deny role permissions
5. User overwrites - Highest priority, can override roles

**Permission Calculation:**

```
final_permissions = base_permissions | role_permissions | channel_allows & ~channel_denies
```

### Advanced Features

- Message threads và forum channels
- Emoji reactions với custom emojis
- Message pinning trong channels
- Slowmode để giới hạn spam
- NSFW channel restrictions
- Audit logs cho admin actions
- Webhook integrations
- Bot permissions và OAuth scopes

## Database

### Database cho từng Service

| Service                  | Database đề xuất                 |
| ------------------------ | -------------------------------- |
| Auth Service             | PostgreSQL                       |
| User & Social Service    | PostgreSQL + Redis (cache)       |
| Server & Channel Service | PostgreSQL + Redis (cache)       |
| Message Service          | MongoDB + Elasticsearch (search) |
| Media & File Service     | PostgreSQL + Object Storage (S3) |
| Realtime Service         | Redis + PostgreSQL               |

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

## System Architecture (Optimized)

```
┌─────────────────────────────────────────┐
│              Client Apps                │
│        (Web / Mobile / Desktop)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│             Gateway API                 │
│    (Authentication, Rate Limiting,      │
│     Load Balancing, Request Routing)    │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌────▼────┐   ┌────▼────┐
│ Auth  │    │ User &  │   │Server & │
│Service│    │ Social  │   │Channel  │
│       │    │Service  │   │Service  │
└───────┘    └─────────┘   └─────────┘
    │             │             │
┌───▼───┐    ┌────▼────┐   ┌────▼────┐
│Media &│    │Message  │   │Realtime │
│ File  │    │Service  │   │Service  │
│Service│    │         │   │         │
└───────┘    └─────────┘   └─────────┘

Database Layer:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│PostgreSQL│ │ MongoDB │ │  Redis  │ │   S3    │
│ (ACID)   │ │(Messages)│ │(Cache)  │ │(Files)  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Kiến trúc mới (6 services) vs Cũ (13 services):**

- ✅ Giảm 54% số lượng services
- ✅ Giảm network latency và complexity
- ✅ Dễ maintain và debug
- ✅ Vẫn đảm bảo separation of concerns
- ✅ Independent scaling và technology choices

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
