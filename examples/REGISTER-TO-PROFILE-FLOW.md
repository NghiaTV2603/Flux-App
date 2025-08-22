# Flow Example: Register → Get Profile với Redis Rate Limiting

## Tổng quan Flow

Đây là ví dụ cụ thể về cách user register rồi call API để lấy profile, với tất cả các bước Redis rate limiting và session management.

## 🎬 Step-by-step Flow

### Step 1: User Register

**HTTP Request:**

```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

**Gateway API xử lý:**

1. **RateLimitGuard check:**

```typescript
// Rate limit key cho register
const key = "rate_limit:/auth/register:anonymous:192.168.1.100:900000";

// Check Redis
const current = await redis.incrementRateLimit(key, 900); // 15 minutes = 900 seconds

// Limit: 5 requests per 15 minutes
if (current > 5) {
  throw new HttpException("Too many requests", 429);
}

// current = 1 (first request)
// ✅ Pass rate limit check
```

2. **Forward request tới Auth Service**

**Auth Service xử lý:**

```typescript
// 1. Validate input
const { email, username, password } = registerDto;

// 2. Check existing user
const existingUser = await prisma.user.findFirst({
  where: { OR: [{ email }, { username }] },
});

// 3. Create new user
const user = await prisma.user.create({
  data: {
    email: "john.doe@example.com",
    username: "johndoe",
    passwordHash: "$2a$12$hashed_password...",
  },
});
// user.id = "cm4abc123def456ghi789"

// 4. Generate tokens
const accessToken = await jwtService.signAsync({
  sub: "cm4abc123def456ghi789",
});
const refreshToken = crypto.randomBytes(64).toString("hex");

// 5. Store session in PostgreSQL
await prisma.userSession.create({
  data: {
    userId: "cm4abc123def456ghi789",
    refreshTokenHash: "hashed_refresh_token",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
});

// 6. 🔥 QUAN TRỌNG: Store session in Redis
const sessionData = {
  userId: "cm4abc123def456ghi789",
  deviceInfo: null,
  createdAt: "2024-01-15T10:00:00.000Z",
  expiresAt: "2024-01-22T10:00:00.000Z",
};

await redisService.setUserSession(
  "cm4abc123def456ghi789",
  sessionData,
  3600 // 1 hour TTL
);
```

**Redis state sau register:**

```
# Rate limit key
rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1"
TTL: 900 seconds (15 minutes)

# Session key
session:cm4abc123def456ghi789 = "{\"userId\":\"cm4abc123def456ghi789\",\"deviceInfo\":null,\"createdAt\":\"2024-01-15T10:00:00.000Z\",\"expiresAt\":\"2024-01-22T10:00:00.000Z\"}"
TTL: 3600 seconds (1 hour)
```

**Response:**

```json
{
  "user": {
    "id": "cm4abc123def456ghi789",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbTRhYmMxMjNkZWY0NTZnaGk3ODkiLCJpYXQiOjE3MDUzMTI4MDAsImV4cCI6MTcwNTMxNjQwMH0.signature",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6..."
}
```

### Step 2: User gọi API Get Profile (sau 30 giây)

**HTTP Request:**

```http
GET http://localhost:3000/users/cm4abc123def456ghi789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbTRhYmMxMjNkZWY0NTZnaGk3ODkiLCJpYXQiOjE3MDUzMTI4MDAsImV4cCI6MTcwNTMxNjQwMH0.signature
```

**Gateway API xử lý:**

#### A. RateLimitGuard

```typescript
// 1. Parse JWT để lấy userId (không verify, chỉ decode)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const decoded = jwt.decode(token); // { sub: "cm4abc123def456ghi789" }
const userId = decoded?.sub || "anonymous";

// 2. Generate rate limit key
const ip = "192.168.1.100";
const endpoint = "/users/:id";
const windowMs = 60000; // 1 minute

const key = `rate_limit:${endpoint}:${userId}:${ip}:${windowMs}`;
// key = "rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000"

// 3. Check rate limit
const current = await redis.incrementRateLimit(key, 60);
// current = 1 (first request to this endpoint)

// 4. Check against limit (100 requests per minute)
if (current > 100) {
  throw new HttpException("Too many requests", 429);
}

// ✅ Pass rate limit (1 <= 100)
```

#### B. AuthGuard

```typescript
// 1. Extract token from Authorization header
const authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const token = authHeader.split(" ")[1];

// 2. Check token blacklist
const isBlacklisted = await redis.exists(`blacklist:${token}`);
// isBlacklisted = false (token not blacklisted)

// 3. Verify JWT token
const payload = await jwtService.verifyAsync(token, {
  secret: "your-super-secret-jwt-key-change-in-production",
});
// payload = { sub: "cm4abc123def456ghi789", iat: 1705312800, exp: 1705316400 }

// 4. 🔥 QUAN TRỌNG: Check session in Redis
const userSession = await redis.get(`session:${payload.sub}`);
// userSession = "{\"userId\":\"cm4abc123def456ghi789\",...}"

if (!userSession) {
  throw new UnauthorizedException("Session expired");
}

// ✅ Session exists, parse it
const sessionData = JSON.parse(userSession);

// 5. Attach user info to request
request["user"] = payload;
request["token"] = token;
```

#### C. Forward request tới User Service

```typescript
// Gateway tạo config với auth header
const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

// Call User Service
const response = await httpClient.get(
  "user-social",
  `/users/cm4abc123def456ghi789`,
  config
);
```

**Redis state sau get profile:**

```
# Rate limit keys
rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1"
TTL: 870 seconds (15 minutes - 30 seconds)

rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000 = "1"
TTL: 60 seconds (1 minute)

# Session key (unchanged)
session:cm4abc123def456ghi789 = "{\"userId\":\"cm4abc123def456ghi789\",...}"
TTL: 3570 seconds (1 hour - 30 seconds)
```

**User Service Response:**

```json
{
  "id": "cm4abc123def456ghi789",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "displayName": null,
  "bio": null,
  "avatar": null,
  "status": "online",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Step 3: User gọi lại API Get Profile 100 lần trong 1 phút

**Requests 2-100:**

```http
GET http://localhost:3000/users/cm4abc123def456ghi789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**RateLimitGuard xử lý:**

```typescript
// Cùng rate limit key
const key = "rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000";

// Mỗi request increment counter
const current = await redis.incrementRateLimit(key, 60);

// Request 2: current = 2
// Request 3: current = 3
// ...
// Request 100: current = 100

// ✅ Tất cả pass vì current <= 100
```

**Request 101:**

```typescript
const current = await redis.incrementRateLimit(key, 60);
// current = 101

if (current > 100) {
  throw new HttpException(
    {
      statusCode: 429,
      message: "Too many requests, please try again later",
      error: "Too Many Requests",
    },
    429
  );
}

// ❌ Request bị reject với 429 Too Many Requests
```

**Response cho request 101:**

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "error": "Too Many Requests"
}
```

### Step 4: User đợi 1 phút rồi thử lại

**Sau 1 phút, rate limit key expire:**

```
# Key này đã bị Redis tự động xóa do TTL expired
rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000 = EXPIRED
```

**Request mới:**

```typescript
const current = await redis.incrementRateLimit(key, 60);
// current = 1 (key mới được tạo)

// ✅ Pass rate limit check
```

## 🔍 Redis Keys Timeline

```
t=0s (Register):
├── rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1" (TTL: 900s)
└── session:cm4abc123def456ghi789 = "{...}" (TTL: 3600s)

t=30s (Get Profile #1):
├── rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1" (TTL: 870s)
├── rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000 = "1" (TTL: 60s)
└── session:cm4abc123def456ghi789 = "{...}" (TTL: 3570s)

t=90s (Get Profile #101 - Rate Limited):
├── rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1" (TTL: 810s)
├── rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000 = "101" (TTL: 30s)
└── session:cm4abc123def456ghi789 = "{...}" (TTL: 3510s)

t=120s (Rate limit key expired):
├── rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1" (TTL: 780s)
├── rate_limit:/users/:id:... = EXPIRED ❌
└── session:cm4abc123def456ghi789 = "{...}" (TTL: 3480s)

t=120s (New request - Rate limit reset):
├── rate_limit:/auth/register:anonymous:192.168.1.100:900000 = "1" (TTL: 780s)
├── rate_limit:/users/:id:cm4abc123def456ghi789:192.168.1.100:60000 = "1" (TTL: 60s) ✅ NEW
└── session:cm4abc123def456ghi789 = "{...}" (TTL: 3480s)
```

## 🚨 Error Scenarios

### Scenario 1: Session Expired (sau 1 giờ)

```http
GET http://localhost:3000/users/cm4abc123def456ghi789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**AuthGuard:**

```typescript
// JWT vẫn valid (expire sau 1 giờ)
const payload = await jwtService.verifyAsync(token);
// ✅ JWT valid

// Nhưng session đã expire trong Redis
const userSession = await redis.get(`session:${payload.sub}`);
// userSession = null (key expired)

if (!userSession) {
  throw new UnauthorizedException("Session expired");
}
// ❌ Throw UnauthorizedException
```

**Response:**

```json
{
  "statusCode": 401,
  "message": "Session expired"
}
```

### Scenario 2: Token Blacklisted (sau logout)

**User logout:**

```http
POST http://localhost:3000/auth/logout
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
}
```

**Auth Service:**

```typescript
// Add token to blacklist
await redisService.blacklistToken(accessToken, 3600); // TTL = remaining JWT time
```

**User cố gọi API với token đã logout:**

```http
GET http://localhost:3000/users/cm4abc123def456ghi789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**AuthGuard:**

```typescript
const isBlacklisted = await redis.exists(`blacklist:${token}`);
// isBlacklisted = true

if (isBlacklisted) {
  throw new UnauthorizedException("Token is disabled");
}
// ❌ Throw UnauthorizedException
```

## 📊 Performance Metrics

### Redis Operations Latency:

- Rate limit check: ~0.5-1ms
- Session check: ~0.5-1ms
- Blacklist check: ~0.5-1ms
- **Total auth overhead: ~2-3ms per request**

### Memory Usage:

- Session key: ~200 bytes
- Rate limit key: ~50 bytes
- Blacklist key: ~1KB (JWT size)

### Auto Cleanup:

- Rate limit keys: Auto expire sau windowMs
- Session keys: Auto expire sau 1 hour
- Blacklist keys: Auto expire khi JWT expire

## ✅ Kết luận

Flow này đảm bảo:

1. **Security**:

   - JWT verification
   - Session validation
   - Token blacklist

2. **Rate Limiting**:

   - Per-user, per-IP, per-endpoint
   - Automatic reset sau time window
   - Different limits cho different endpoints

3. **Performance**:

   - Redis operations rất nhanh (~1ms)
   - Automatic cleanup với TTL
   - No manual maintenance required

4. **Reliability**:
   - Atomic Redis operations
   - Consistent state management
   - Graceful error handling
