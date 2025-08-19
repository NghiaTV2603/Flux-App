# User Service - Friend API Implementation

## Tổng quan

User Service đã được cập nhật để hỗ trợ đầy đủ các tính năng friend management theo design mới nhất. Service này bây giờ là **User & Social Service** - kết hợp user profiles và social features.

## API Endpoints

### 👤 User Profile Management

| Method  | Endpoint                                 | Mô tả                      |
| ------- | ---------------------------------------- | -------------------------- |
| `GET`   | `/users/:userId`                         | Lấy thông tin user profile |
| `PATCH` | `/users/:userId`                         | Cập nhật user profile      |
| `GET`   | `/users/status/:userId`                  | Lấy trạng thái user        |
| `PATCH` | `/users/:userId/status`                  | Cập nhật trạng thái user   |
| `GET`   | `/users/search?q=query&currentUserId=id` | Tìm kiếm users             |

### 🤝 Friend Management

| Method   | Endpoint                                | Mô tả                    |
| -------- | --------------------------------------- | ------------------------ |
| `POST`   | `/users/friends/request?requesterId=id` | Gửi lời mời kết bạn      |
| `POST`   | `/users/friends/respond?userId=id`      | Phản hồi lời mời kết bạn |
| `GET`    | `/users/friends?userId=id`              | Lấy danh sách bạn bè     |
| `GET`    | `/users/friends/pending?userId=id`      | Lấy lời mời đang chờ     |
| `GET`    | `/users/friends/sent?userId=id`         | Lấy lời mời đã gửi       |
| `DELETE` | `/users/friends/remove?userId=id`       | Xóa bạn                  |

### 🚫 Block Management

| Method   | Endpoint                      | Mô tả                        |
| -------- | ----------------------------- | ---------------------------- |
| `POST`   | `/users/block?blockerId=id`   | Block user                   |
| `DELETE` | `/users/unblock?blockerId=id` | Unblock user                 |
| `GET`    | `/users/blocked?userId=id`    | Lấy danh sách users đã block |

### ⚙️ User Settings

| Method  | Endpoint                  | Mô tả                 |
| ------- | ------------------------- | --------------------- |
| `GET`   | `/users/:userId/settings` | Lấy cài đặt user      |
| `PATCH` | `/users/:userId/settings` | Cập nhật cài đặt user |

### 🎮 User Activities

| Method   | Endpoint                    | Mô tả                    |
| -------- | --------------------------- | ------------------------ |
| `POST`   | `/users/:userId/activities` | Tạo activity mới         |
| `GET`    | `/users/:userId/activities` | Lấy danh sách activities |
| `DELETE` | `/users/:userId/activities` | Xóa activities           |

## Friend Request Flow

### 1. Gửi Friend Request

```http
POST /users/friends/request?requesterId={userId}
{
  "addresseeId": "target-user-id",
  "message": "Hey! Let's be friends!"
}
```

### 2. Nhận và Phản hồi Friend Request

```http
# Xem pending requests
GET /users/friends/pending?userId={userId}

# Accept request
POST /users/friends/respond?userId={userId}
{
  "friendshipId": "friendship-id",
  "response": "accepted"
}
```

### 3. Quản lý Friends

```http
# Xem danh sách bạn bè
GET /users/friends?userId={userId}

# Xóa bạn
DELETE /users/friends/remove?userId={userId}
{
  "friendId": "friend-user-id"
}
```

## Database Schema

### Friendship Model

```prisma
model Friendship {
  id           String           @id @default(uuid())
  requesterId  String           @map("requester_id")
  addresseeId  String           @map("addressee_id")
  status       FriendshipStatus @default(pending)
  message      String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  respondedAt  DateTime?

  requester UserProfile @relation("FriendRequester", fields: [requesterId], references: [userId])
  addressee UserProfile @relation("FriendAddressee", fields: [addresseeId], references: [userId])
}
```

### Block Model

```prisma
model Block {
  id        String   @id @default(uuid())
  blockerId String   @map("blocker_id")
  blockedId String   @map("blocked_id")
  reason    String?
  createdAt DateTime @default(now())

  blocker UserProfile @relation("Blocker", fields: [blockerId], references: [userId])
  blocked UserProfile @relation("Blocked", fields: [blockedId], references: [userId])
}
```

## RabbitMQ Events

### Published Events

1. **friend.request.sent** - Khi gửi friend request

```json
{
  "fromUserId": "requester-id",
  "toUserId": "addressee-id",
  "requestId": "friendship-id"
}
```

2. **friend.request.accepted** - Khi accept friend request

```json
{
  "fromUserId": "requester-id",
  "toUserId": "addressee-id",
  "requestId": "friendship-id"
}
```

3. **user.profile.updated** - Khi cập nhật profile

```json
{
  "userId": "user-id",
  "username": "new-username",
  "displayName": "New Display Name",
  "avatar": "avatar-url",
  "bio": "new bio"
}
```

4. **user.status.changed** - Khi thay đổi status

```json
{
  "userId": "user-id",
  "status": "online",
  "customStatus": "Playing games"
}
```

## Validation Rules

### Friend Request Validation

- ✅ Không thể gửi friend request cho chính mình
- ✅ Không thể gửi request cho user đã block
- ✅ Không thể gửi request nếu đã có friendship
- ✅ Kiểm tra privacy settings của người nhận
- ✅ User phải tồn tại trong hệ thống

### Block Validation

- ✅ Không thể block chính mình
- ✅ Không thể block user đã block
- ✅ Tự động xóa friendship khi block
- ✅ User phải tồn tại trong hệ thống

## Features Implemented

### ✅ Core Friend Features

- [x] Send friend requests với optional message
- [x] Accept/decline friend requests
- [x] View friends list với online status
- [x] View pending friend requests
- [x] View sent friend requests
- [x] Remove friends
- [x] Search users với relationship status

### ✅ Block System

- [x] Block users với optional reason
- [x] Unblock users
- [x] View blocked users list
- [x] Auto-remove friendship when blocking

### ✅ Privacy & Settings

- [x] User privacy settings
- [x] Allow/disallow friend requests
- [x] Show/hide online status
- [x] Theme preferences

### ✅ User Activities

- [x] Set current activity (playing, listening, etc.)
- [x] Activity expiration
- [x] Multiple activity types
- [x] Activity metadata

### ✅ Real-time Events

- [x] RabbitMQ event publishing
- [x] Friend request notifications
- [x] Status change notifications
- [x] Profile update notifications

## Testing

Sử dụng file `test-user-friend-api.http` để test các endpoints:

1. **Setup**: Cập nhật `@authToken`, `@userId1`, `@userId2` trong file
2. **Test Flow**: Chạy các requests theo thứ tự trong file
3. **Verify**: Kiểm tra responses và database changes

## Integration với Gateway API

Gateway API đã được cập nhật với `UserSocialController` để route requests đến User Service:

```typescript
// Gateway routes to User Service
'user-social' → User & Social Service (port 3002)
```

## Next Steps

1. **Message Service Integration**: Khi friend request được accept, Message Service sẽ tự động tạo DM conversation
2. **Realtime Service Integration**: Real-time notifications cho friend requests
3. **Caching**: Implement Redis caching cho friends list và user status
4. **Analytics**: Track friendship statistics và user engagement

## Security Notes

- ✅ Tất cả endpoints đều validate user permissions
- ✅ Rate limiting được implement ở Gateway level
- ✅ Input validation với class-validator
- ✅ Privacy settings được respect
- ✅ Block system ngăn chặn harassment
