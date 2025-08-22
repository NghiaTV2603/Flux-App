# 🧪 Flux API Testing Suite

## ⭐ RECOMMENDED: Gateway Complete Tests

**File chính cho Frontend development:** `gateway-complete.http`

### 🎯 Tại sao dùng Gateway API?

1. **Production Ready**: Frontend chỉ gọi Gateway API trong thực tế
2. **Authentication**: Gateway handle JWT tokens và forwarding
3. **Rate Limiting**: Built-in rate limiting cho từng endpoint
4. **Error Handling**: Consistent error responses
5. **Service Discovery**: Gateway route đến đúng microservice

## 📁 Cấu trúc Files

### ⭐ Gateway Complete Tests

**File:** `gateway-complete.http`  
**Port:** 3000 (API Gateway)  
**Mục đích:** **CHÍNH** - Dành cho Frontend development

**84+ Test Cases bao gồm:**

- ✅ Authentication (Register, Login, OAuth, Password Reset)
- ✅ User Management (Profile, Status, Search)
- ✅ Friend System (Request, Accept, Block, Remove)
- ✅ Server Management (Create, Update, Join, Leave)
- ✅ Channel Management (Text/Voice channels, Members)
- ✅ Role & Permission System (Create, Assign, Permissions)
- ✅ Messaging (Send, Edit, Delete, Reactions, DMs)
- ✅ File Management (Upload, Download, Avatars, Server icons)
- ✅ Real-time Features (WebSocket, Voice, Screen share, Presence)
- ✅ Notifications (Settings, Read/Unread, Push notifications)
- ✅ Error Scenarios (Rate limiting, Invalid tokens, etc.)

### 🌐 Gateway API Tests (Basic)

**File:** `gateway-api.http`  
**Port:** 3000  
**Mục đích:** Basic Gateway testing

### 🔧 Direct Service Tests (Backend debugging only)

- `auth-service.http` - Auth Service (Port 3001)
- `user-service.http` - User Service (Port 3002)
- `server-service.http` - Server Service (Port 3003)

## 🚀 Frontend Development Workflow

### 1. Setup Environment

```bash
# Start all services
docker-compose up -d

# Wait for health checks (~30s)
curl http://localhost:3000/health
```

### 2. Open Main Test File

```
📁 tests/gateway-complete.http
```

### 3. Authentication Flow

```http
# 1. Register user
POST http://localhost:3000/auth/register
{
  "email": "frontend@example.com",
  "username": "frontenduser",
  "password": "password123"
}

# 2. Login and get token
POST http://localhost:3000/auth/login
{
  "email": "frontend@example.com",
  "password": "password123"
}

# 3. Copy accessToken từ response
# 4. Update variable:
@accessToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Test Features

```http
# User profile
GET http://localhost:3000/users/{{testUserId}}
Authorization: Bearer {{accessToken}}

# Create server
POST http://localhost:3000/servers
Authorization: Bearer {{accessToken}}
{
  "name": "My Server",
  "description": "Test server"
}

# Send message
POST http://localhost:3000/channels/{{channelId}}/messages
Authorization: Bearer {{accessToken}}
{
  "content": "Hello from Frontend!"
}
```

## 🔧 Variables Management

### Template Variables

```http
@baseUrl = http://localhost:3000
@testEmail = frontend@example.com
@testUsername = frontenduser
@testPassword = password123

# Update these after API calls:
@accessToken = paste-token-after-login
@testUserId = paste-user-id-here
@serverId = paste-server-id-here
@channelId = paste-channel-id-here
```

### Dynamic Variables Flow

```
1. Register/Login → Get accessToken
2. Create Server → Get serverId
3. Create Channel → Get channelId
4. Send Message → Get messageId
5. Upload File → Get fileId
```

## 🛡️ Security & Rate Limiting

### Rate Limits per Endpoint Type

```
Authentication:  5-10 requests/15min
File Upload:     5-20 requests/min
Messaging:       30-50 requests/min
General API:     50-100 requests/min
Real-time:       100-200 requests/min
```

### Authentication Headers

```http
# All protected endpoints require:
Authorization: Bearer {{accessToken}}
```

### Error Responses

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

## 📊 Expected Performance

### Response Times

- **Health checks:** < 50ms
- **Authentication:** < 200ms
- **Simple queries:** < 200ms
- **Complex operations:** < 500ms
- **File uploads:** < 2000ms

### Success Status Codes

- `200` - OK (GET, PATCH requests)
- `201` - Created (POST requests)
- `204` - No Content (DELETE requests)

### Error Status Codes

- `400` - Bad Request (Invalid data)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource doesn't exist)
- `429` - Too Many Requests (Rate limited)
- `500` - Internal Server Error

## 🎯 Integration with Frontend

### React/Vue/Angular Integration

```javascript
// API Base Configuration
const API_BASE_URL = "http://localhost:3000";

// Authentication
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  localStorage.setItem("accessToken", data.accessToken);
  return data;
};

// Authenticated Requests
const getProfile = async (userId) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
```

### Axios Configuration

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

## 🔍 Debugging Tips

### Health Check Commands

```bash
# Gateway health
curl http://localhost:3000/health

# All services health
curl http://localhost:3000/health/services

# Individual service health
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # User
curl http://localhost:3003/health  # Server
```

### Common Issues & Solutions

**Rate Limited (429):**

```bash
# Wait for rate limit window to reset
# Or use different test credentials
```

**Unauthorized (401):**

```bash
# Re-login to get new token
# Check token expiration
# Verify Authorization header format
```

**Service Unavailable (503):**

```bash
# Check Docker containers
docker ps

# Restart services
docker-compose restart

# Check logs
docker-compose logs -f gateway-api
```

### Log Analysis

```bash
# Gateway logs
docker-compose logs -f gateway-api

# Filter authentication logs
docker-compose logs gateway-api | grep auth

# Filter error logs
docker-compose logs | grep ERROR

# Real-time logs
docker-compose logs -f --tail=100
```

## 📈 Advanced Testing

### Load Testing

```bash
# Simple load test with curl
for i in {1..10}; do
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:3000/users/123 &
done
wait

# Using Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
   http://localhost:3000/users/123
```

### WebSocket Testing

```javascript
// Test WebSocket connection
const ws = new WebSocket("ws://localhost:3000/ws/connect", [], {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

ws.onopen = () => console.log("Connected to Gateway WebSocket");
ws.onmessage = (event) => console.log("Message:", event.data);
ws.onerror = (error) => console.error("WebSocket error:", error);
```

---

## 🎉 Quick Start Summary

1. **Start services:** `docker-compose up -d`
2. **Open:** `tests/gateway-complete.http`
3. **Register & Login:** Get accessToken
4. **Test features:** Run test cases you need
5. **Integrate:** Use same endpoints in Frontend code

**Gateway API là single source of truth cho Frontend! 🚀**
