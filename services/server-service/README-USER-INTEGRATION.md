# User Service Integration

## Tổng quan

Server Service đã được tích hợp với User Service để lấy thông tin user thực tế thay vì dùng dữ liệu hardcode.

## Cách hoạt động

### 1. UserClientService

```typescript
// Lấy thông tin 1 user
const userProfile = await this.userClient.getUserProfile(userId);

// Lấy thông tin nhiều users (batch)
const userProfiles = await this.userClient.getUserProfiles(userIds);
```

### 2. Fallback Strategy

Khi User Service không khả dụng:

- Service vẫn hoạt động bình thường
- Tự động tạo username fallback: `User{last4DigitsOfUserId}`
- Log warning nhưng không throw error

### 3. Integration Points

#### Tạo Server (`createServer`)

```typescript
// Trước khi tạo server, lấy thông tin user
const userProfile = await this.userClient.getUserProfile(userId);
if (!userProfile) {
  throw new NotFoundException("User not found");
}

// Sử dụng thông tin thực tế
const serverMember = await tx.serverMember.create({
  data: {
    serverId: server.id,
    userId: userId,
    username: userProfile.username, // Từ User Service
    displayName: userProfile.displayName, // Từ User Service
  },
});
```

#### Join Server (`joinServer`)

```typescript
// Tương tự khi user join server
const userProfile = await this.userClient.getUserProfile(userId);
const newMember = await tx.serverMember.create({
  data: {
    serverId: server.id,
    userId,
    username: userProfile.username,
    displayName: userProfile.displayName,
  },
});
```

#### Get Server Members (`getServerMembers`)

```typescript
// Enrich member data với thông tin user mới nhất
const userIds = server.members.map((member) => member.userId);
const userProfiles = await this.userClient.getUserProfiles(userIds);

const enrichedMembers = server.members.map((member) => {
  const profile = userProfiles.get(member.userId);
  return {
    ...member,
    username: profile?.username || member.username,
    displayName: profile?.displayName || member.displayName,
    avatarUrl: profile?.avatarUrl, // Thông tin bổ sung
    email: profile?.email, // Thông tin bổ sung
  };
});
```

## Configuration

### Environment Variables

```bash
# User Service URL
USER_SERVICE_URL="http://localhost:3001"
```

### Config File

```typescript
// src/config/configuration.ts
export default () => ({
  // ...
  userService: {
    url: process.env.USER_SERVICE_URL || "http://localhost:3001",
  },
});
```

## API Endpoints User Service cần implement

### 1. Get Single User

```http
GET /users/{userId}

Response:
{
  "id": "user-123",
  "username": "john_doe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### 2. Get Multiple Users (Batch) - Optional

```http
POST /users/batch
Content-Type: application/json

{
  "userIds": ["user1", "user2", "user3"]
}

Response:
[
  {
    "id": "user1",
    "username": "john_doe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://example.com/avatar1.jpg"
  },
  // ...
]
```

## Error Handling

### User Service không khả dụng

```typescript
// UserClientService sẽ:
// 1. Log warning
// 2. Return fallback data
// 3. Service tiếp tục hoạt động

return {
  id: userId,
  username: `User${userId.slice(-4)}`, // User1234
  displayName: `User${userId.slice(-4)}`,
};
```

### User không tồn tại

```typescript
// Trong createServer/joinServer:
const userProfile = await this.userClient.getUserProfile(userId);
if (!userProfile) {
  throw new NotFoundException("User not found");
}
```

## Benefits

### 1. **Real User Data**

- Username và displayName thực tế từ User Service
- Thông tin bổ sung như email, avatar
- Dữ liệu luôn được sync

### 2. **Resilience**

- Service vẫn hoạt động khi User Service down
- Graceful fallback với dữ liệu tạm thời
- No single point of failure

### 3. **Performance**

- Batch API cho multiple users
- Caching có thể thêm sau
- Async calls không block main flow

### 4. **Consistency**

- Centralized user data management
- Consistent user information across services
- Easy to update user profiles

## Testing

Sử dụng file `test-user-integration.http` để test:

1. **Happy Path**: User Service available
2. **Fallback**: User Service unavailable
3. **Batch Operations**: Multiple users
4. **Error Cases**: User not found

## Future Enhancements

### 1. **Caching**

```typescript
// Redis cache cho user profiles
const cachedProfile = await this.redis.get(`user:${userId}`);
if (cachedProfile) {
  return JSON.parse(cachedProfile);
}
```

### 2. **Event-Driven Updates**

```typescript
// Listen to user.updated events
@EventPattern('user.updated')
async handleUserUpdated(data: { userId: string, profile: UserProfile }) {
  await this.updateServerMemberProfile(data.userId, data.profile);
}
```

### 3. **Circuit Breaker**

```typescript
// Implement circuit breaker pattern
if (this.circuitBreaker.isOpen()) {
  return this.getFallbackUserData(userId);
}
```

## Monitoring

### Metrics to track:

- User Service response time
- Fallback usage rate
- Cache hit/miss ratio
- Error rates by endpoint

### Logs to monitor:

- User Service unavailable warnings
- Fallback data usage
- User not found errors
- Batch request performance
