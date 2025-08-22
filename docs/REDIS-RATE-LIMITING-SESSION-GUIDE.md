# Redis Rate Limiting & Session Management Guide

## Tổng quan Architecture

Flux app sử dụng Redis để quản lý 2 chức năng quan trọng:

1. **Rate Limiting** - Giới hạn số request từ user/IP
2. **Session Management** - Quản lý phiên đăng nhập của user

## 🔧 Kiến trúc Redis trong hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Gateway API   │    │   Auth Service  │
│                 │    │                 │    │                 │
│ - Send requests │───▶│ - Rate limiting │    │ - Create session│
│ - Include JWT   │    │ - Auth check    │    │ - Store in Redis│
│                 │    │ - Forward req   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                         ┌─────────────────────────────────────┐
                         │            Redis                    │
                         │                                     │
                         │ Rate Limit Keys:                    │
                         │ rate_limit:endpoint:userId:ip:ttl   │
                         │                                     │
                         │ Session Keys:                       │
                         │ session:userId                      │
                         │                                     │
                         │ Blacklist Keys:                     │
                         │ blacklist:token                     │
                         └─────────────────────────────────────┘
```

## 🚀 Flow Example: Register → Get Profile

### 1. User Register

**Request:**

```http
POST /auth/register
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123"
}
```

**Auth Service xử lý:**

```typescript
// 1. Validate & create user in database
const user = await this.prisma.user.create({...});

// 2. Generate JWT access token & refresh token
const accessToken = await this.generateAccessToken(user.id);
const refreshToken = this.generateRefreshToken();

// 3. QUAN TRỌNG: Store session trong Redis
const sessionData = {
  userId: user.id,
  deviceInfo: null,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

// Key: session:USER_ID, TTL: 3600 seconds (1 hour)
await this.redisService.setUserSession(user.id, sessionData, 3600);
```

**Redis sau register:**

```
session:user-123-456 = {
  "userId": "user-123-456",
  "deviceInfo": null,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "expiresAt": "2024-01-22T10:00:00.000Z"
}
TTL: 3600 seconds
```

**Response:**

```json
{
  "user": {
    "id": "user-123-456",
    "email": "user@example.com",
    "username": "testuser"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### 2. User gọi API Get Profile

**Request:**

```http
GET /users/user-123-456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Gateway API xử lý request qua 2 Guards:**

#### A. RateLimitGuard kiểm tra

```typescript
// 1. Tạo rate limit key
const userId = "user-123-456"; // Từ JWT (nếu có)
const ip = "192.168.1.100";
const endpoint = "/users/:id";
const windowMs = 60000; // 1 minute

const key = `rate_limit:${endpoint}:${userId}:${ip}:${windowMs}`;
// Key: rate_limit:/users/:id:user-123-456:192.168.1.100:60000

// 2. Increment counter trong Redis
const current = await this.redisService.incrementRateLimit(key, 60); // TTL 60 seconds

// 3. Check limit (100 requests per minute cho GET /users/:id)
if (current > 100) {
  throw new HttpException("Too many requests", 429);
}
```

**Redis sau rate limit check:**

```
rate_limit:/users/:id:user-123-456:192.168.1.100:60000 = 1
TTL: 60 seconds
```

#### B. AuthGuard kiểm tra

```typescript
// 1. Extract JWT token từ header
const token = extractTokenFromHeader(request);
// token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 2. Check blacklist
const isBlacklisted = await this.redisService.exists(`blacklist:${token}`);
if (isBlacklisted) {
  throw new UnauthorizedException("Token is disabled");
}

// 3. Verify JWT
const payload = await this.jwtService.verifyAsync(token);
// payload = { sub: "user-123-456", iat: 1705312800, exp: 1705316400 }

// 4. QUAN TRỌNG: Check session trong Redis
const userSession = await this.redisService.get(`session:${payload.sub}`);
// userSession = JSON string của session data

if (!userSession) {
  throw new UnauthorizedException("Session expired");
}

// 5. Attach user info to request
request["user"] = payload;
request["token"] = token;
```

#### C. Forward request tới User Service

Nếu pass qua cả 2 guards, request được forward tới User Service để lấy profile.

## 🔍 Chi tiết Redis Operations

### 1. Rate Limiting Logic

```typescript
// RedisService.incrementRateLimit()
async incrementRateLimit(key: string, windowSize: number): Promise<number> {
  const multi = this.client.multi(); // Bắt đầu transaction
  multi.incr(key);                   // Increment counter
  multi.expire(key, windowSize);     // Set TTL
  const results = await multi.exec(); // Execute transaction
  return results && results[0] ? (results[0][1] as number) : 0;
}
```

**Tại sao dùng multi/transaction?**

- Đảm bảo atomic operation
- Tránh race condition khi có nhiều request đồng thời
- Set TTL ngay sau khi increment để tránh key tồn tại mãi mãi

### 2. Session Management Logic

```typescript
// Lưu session
async setUserSession(userId: string, sessionData: any, ttlSeconds: number) {
  const sessionKey = `session:${userId}`;
  await this.set(sessionKey, JSON.stringify(sessionData), ttlSeconds);
}

// Kiểm tra session
async getUserSession(userId: string) {
  const sessionKey = `session:${userId}`;
  const sessionData = await this.get(sessionKey);
  return sessionData ? JSON.parse(sessionData) : null;
}
```

### 3. Token Blacklist Logic

```typescript
// Blacklist token khi logout
async blacklistToken(token: string, ttlSeconds: number) {
  const blacklistKey = `blacklist:${token}`;
  await this.set(blacklistKey, '1', ttlSeconds);
}
```

## 🎯 Rate Limiting Configuration

Mỗi endpoint có limit khác nhau:

```typescript
// Auth endpoints
@RateLimit({ limit: 5, windowMs: 15 * 60 * 1000 })   // Register: 5/15min
@RateLimit({ limit: 10, windowMs: 15 * 60 * 1000 })  // Login: 10/15min
@RateLimit({ limit: 3, windowMs: 60 * 60 * 1000 })   // Reset password: 3/hour

// User endpoints
@RateLimit({ limit: 100, windowMs: 60 * 1000 })      // Get user: 100/min
@RateLimit({ limit: 10, windowMs: 60 * 1000 })       // Update user: 10/min

// Social endpoints
@RateLimit({ limit: 10, windowMs: 60 * 1000 })       // Friend request: 10/min
@RateLimit({ limit: 50, windowMs: 60 * 1000 })       // Get friends: 50/min
```

## 🐛 Bug đã fix

### Vấn đề trước khi fix:

1. **Auth Service** chỉ lưu session vào **PostgreSQL** (qua Prisma)
2. **Gateway API AuthGuard** lại check session từ **Redis**
3. → Kết quả: AuthGuard luôn throw "Session expired" vì không tìm thấy session trong Redis

### Giải pháp:

1. Tạo `RedisService` cho Auth Service
2. Sửa `generateTokens()` để lưu session vào **cả** PostgreSQL và Redis
3. Sửa `logout()`, `logoutAll()`, `refreshToken()` để sync Redis và database

## 📊 Monitoring Redis Keys

### Các loại keys trong Redis:

```bash
# Session keys
session:user-123-456
session:user-789-012

# Rate limit keys
rate_limit:/auth/login:user-123:192.168.1.100:900000
rate_limit:/users/:id:user-123:192.168.1.100:60000

# Blacklist keys
blacklist:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Redis commands để debug:

```bash
# Xem tất cả keys
KEYS *

# Xem session của user
GET session:user-123-456

# Xem rate limit của endpoint
GET "rate_limit:/users/:id:user-123:192.168.1.100:60000"

# Xem TTL của key
TTL session:user-123-456

# Xem tất cả blacklisted tokens
KEYS blacklist:*
```

## 🚨 Lưu ý quan trọng

1. **TTL Sync**: Session TTL trong Redis (1 hour) khác với database (7 days)

   - Redis TTL = JWT access token expiry
   - Database TTL = Refresh token expiry

2. **Memory Management**: Rate limit keys tự động expire sau windowMs

   - Không cần cleanup manual
   - Redis sẽ tự động xóa expired keys

3. **Security**: Token blacklist giúp revoke tokens ngay lập tức

   - Khi user logout, token được add vào blacklist
   - AuthGuard check blacklist trước khi verify JWT

4. **Performance**: Redis operations rất nhanh
   - Rate limit check: ~1ms
   - Session check: ~1ms
   - Blacklist check: ~1ms

## 🔄 Session Lifecycle

```
Register/Login → Create session in Redis (TTL: 1h)
                ↓
Access API → AuthGuard checks Redis session
                ↓
Token expires → Session auto-removed from Redis
                ↓
Refresh token → New session created in Redis (TTL: 1h)
                ↓
Logout → Session manually removed from Redis
```

Với cách setup này, hệ thống đảm bảo:

- ✅ Rate limiting hoạt động chính xác
- ✅ Session management đồng bộ
- ✅ Security với token blacklist
- ✅ Performance cao với Redis
- ✅ Automatic cleanup với TTL
