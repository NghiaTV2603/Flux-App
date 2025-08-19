# Gateway API Controllers

Các controllers đã được tái cấu trúc theo kiến trúc mới với 6 services tối ưu hóa.

## Cấu trúc Controllers Mới (6 Services)

### 1. AuthController

- **Service**: Auth Service
- **Chức năng**: Authentication và authorization
- **Endpoints**:
  - `POST /auth/register` - Đăng ký tài khoản
  - `POST /auth/login` - Đăng nhập
  - `POST /auth/oauth` - Đăng nhập OAuth (Google, Discord, GitHub)
  - `POST /auth/forgot-password` - Quên mật khẩu
  - `POST /auth/reset-password` - Reset mật khẩu
  - `POST /auth/refresh-token` - Refresh token

### 2. UserSocialController

- **Service**: User & Social Service
- **Chức năng**: User profiles và social features
- **Endpoints**:
  - **User Profile**: `GET/PATCH /users/:id`, `GET /users/status/:id`, `GET /users` (search)
  - **Friend Management**: `POST /friends/request`, `POST /friends/accept`, `POST /friends/block`
  - **Social Features**: `GET /friends`, `GET /friends/pending`, `GET /friends/blocked`

### 3. ServerChannelController

- **Service**: Server & Channel Service
- **Chức năng**: Servers, channels, roles, permissions
- **Endpoints**:
  - **Server Management**: `POST/GET/PATCH/DELETE /servers`, `POST /servers/join`
  - **Member Management**: `GET/PATCH/DELETE /servers/:id/members`
  - **Channel Management**: `POST/GET/PATCH/DELETE /channels`, `POST /channels/:id/permissions`
  - **Role Management**: `POST/GET/PATCH/DELETE /servers/:id/roles`

### 4. MessageController

- **Service**: Message Service
- **Chức năng**: Tất cả messaging (channel + DM)
- **Endpoints**:
  - **Channel Messages**: `POST/GET/PATCH/DELETE /channels/:channelId/messages`
  - **Message Reactions**: `POST/DELETE /channels/:channelId/messages/:id/reactions`
  - **Direct Messages**: `POST /dm/send`, `GET /dm/conversation/:userId`
  - **Message Threads**: `POST/GET /channels/:channelId/messages/:id/threads`
  - **Message Search**: `GET /messages/search`

### 5. MediaFileController

- **Service**: Media & File Service
- **Chức năng**: File upload, storage, CDN
- **Endpoints**:
  - **File Upload**: `POST /files/upload`, `POST /files/upload-multiple`
  - **File Management**: `GET/DELETE /files/:id`, `GET /files/user/:userId`
  - **Avatar Management**: `POST /avatars/upload`, `DELETE /avatars/:userId`
  - **Server Icons**: `POST/DELETE /servers/:serverId/icon`
  - **File Sharing**: `POST /files/:id/share`, `GET /files/shared/:token`
  - **CDN & Optimization**: `GET /files/:id/thumbnail`, `GET /files/:id/download`

### 6. RealtimeController

- **Service**: Realtime Service
- **Chức năng**: WebSocket, voice calls, notifications
- **Endpoints**:
  - **WebSocket**: `GET /ws/connect`, `POST /ws/disconnect`
  - **Voice Channels**: `POST /voice/channels/:channelId/join`, `GET /voice/channels/:channelId/users`
  - **Voice Control**: `PATCH /voice/channels/:channelId/users/:userId/mute`
  - **Screen Sharing**: `POST /voice/channels/:channelId/screen-share/start`
  - **Notifications**: `GET/PATCH/DELETE /notifications`, `POST /notifications/settings`
  - **Presence**: `POST /presence/update`, `GET /presence/server/:serverId`
  - **Typing Indicators**: `POST /typing/start`, `POST /typing/stop`

### 7. HealthController

- **Chức năng**: Health checks và monitoring
- **Endpoints**: Health check endpoints

## So sánh với Cấu trúc Cũ

### Cũ (13 services):

- AuthController
- UserController
- ServerController
- ChannelController
- FriendController
- DirectMessageController
- FileController
- RoleController
- VoiceController
- WebSocketController
- NotificationController
- SecurityController
- HealthController

### Mới (6 services + health):

- AuthController
- UserSocialController (merge User + Friend)
- ServerChannelController (merge Server + Channel + Role)
- MessageController (merge Channel Messages + DM)
- MediaFileController (merge File + Media)
- RealtimeController (merge Voice + WebSocket + Notification)
- HealthController

## Lợi ích của Kiến trúc Mới

1. **Giảm Complexity**: Từ 13 services xuống 6 services (giảm 54%)
2. **Tăng Performance**: Ít network calls giữa các services
3. **Dễ Maintain**: Logic liên quan được nhóm lại với nhau
4. **Scalability**: Vẫn có thể scale từng service độc lập
5. **Clean Architecture**: Separation of concerns rõ ràng hơn

## Rate Limiting

Mỗi endpoint đều có rate limiting phù hợp:

- Authentication: 3-10 requests/15min
- File Upload: 5-20 requests/min
- Messaging: 30-50 requests/min
- General API: 50-100 requests/min
- Real-time features: 100-200 requests/min

## Service Mapping

Các controllers route requests đến các services tương ứng:

- `auth` → Auth Service
- `user-social` → User & Social Service
- `server-channel` → Server & Channel Service
- `message` → Message Service
- `media-file` → Media & File Service
- `realtime` → Realtime Service
