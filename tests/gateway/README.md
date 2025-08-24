# 🌐 Gateway API Testing Suite

Complete testing suite for Flux API Gateway - tất cả requests đều route qua Gateway (Port 3000) đến các microservices tương ứng.

## 📁 File Structure

```
tests/gateway/
├── _shared-vars.http          # Shared variables cho tất cả tests
├── auth.http                  # Authentication Service tests
├── user-social.http           # User & Social Service tests
├── server-channel.http        # Server & Channel Service tests
├── message.http               # Message Service tests
├── file.http                  # File & Media Service tests
├── realtime.http             # Realtime Service tests
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Start all services
docker-compose up -d

# Verify services are running
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/services
```

### 2. Testing Workflow

1. **Update Shared Variables** (`_shared-vars.http`):

   - Update base URL if needed
   - Set test credentials

2. **Authentication First** (`auth.http`):

   ```http
   # Register new user
   POST {{baseUrl}}/auth/register

   # Login and get tokens
   POST {{baseUrl}}/auth/login
   ```

   - Copy `accessToken` from response
   - Update `@accessToken` in `_shared-vars.http`

3. **Test Services in Order**:
   - `user-social.http` - User profiles & friends
   - `server-channel.http` - Servers & channels
   - `message.http` - Messaging features
   - `file.http` - File uploads & management
   - `realtime.http` - Voice & real-time features

## 📋 Service Testing Details

### 🔐 Authentication Service (`auth.http`)

- User registration & login
- OAuth integrations (Google, Facebook, GitHub)
- Password management (forgot/reset)
- Token management (refresh, validate)
- Email verification

### 👥 User & Social Service (`user-social.http`)

- User profile management
- User settings & preferences
- Friend requests & management
- User blocking & unblocking
- User activities & presence
- User search & directory

### 🏢 Server & Channel Service (`server-channel.http`)

- Server creation & management
- Server invites & member management
- Channel creation (text, voice, category)
- Role creation & permission management
- Channel permissions & moderation

### 💬 Message Service (`message.http`)

- Channel messaging with embeds & attachments
- Message reactions & interactions
- Direct messaging (DMs)
- Message threads & organization
- Message search & history
- Message moderation (pin, delete, bulk operations)

### 📁 File & Media Service (`file.http`)

- File uploads (single & multiple)
- Avatar & server icon management
- File sharing with expirable links
- File processing (thumbnails, variants)
- File search & analytics
- CDN integration & optimization

### ⚡ Realtime Service (`realtime.http`)

- WebSocket connection management
- Voice channel operations
- Screen sharing functionality
- User presence & status updates
- Typing indicators
- Push notifications & settings

## 🔧 Configuration

### Rate Limits

- **Authentication**: 3-10 requests/15min
- **File Upload**: 5-20 requests/min
- **Messaging**: 30-50 requests/min
- **General API**: 50-100 requests/min
- **Real-time**: 100-200 requests/min

### File Limits

- **Max file size**: 100MB (regular), 500MB (premium)
- **Avatar**: 8MB max, JPG/PNG/GIF only
- **Server icon**: 10MB max, JPG/PNG only
- **Allowed types**: images, documents, videos, audio

## 🎯 Testing Best Practices

### 1. Sequential Testing

```bash
# Always test in this order:
1. auth.http (get tokens)
2. user-social.http (setup profile)
3. server-channel.http (create server/channels)
4. message.http (test messaging)
5. file.http (test file features)
6. realtime.http (test real-time features)
```

### 2. Variable Management

- Update `@accessToken` after login
- Update resource IDs (`@serverId`, `@channelId`, etc.) after creation
- Use meaningful test data for better debugging

### 3. Error Testing

- Each file includes error test cases
- Test rate limiting by sending requests quickly
- Test invalid data and unauthorized access

### 4. Cleanup

- Delete test resources after testing
- Use cleanup operations at end of each file
- Reset test data between test runs

## 📊 Expected Response Formats

### Success Response

```json
{
  "data": {
    /* actual data */
  },
  "success": true,
  "timestamp": "2025-08-23T12:00:00Z"
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      /* error details */
    }
  },
  "success": false,
  "timestamp": "2025-08-23T12:00:00Z"
}
```

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  },
  "success": false
}
```

## 🛡️ Security Features Tested

- **JWT Authentication**: All protected endpoints require valid tokens
- **Rate Limiting**: Prevents API abuse and spam
- **Permission Checking**: Server/channel access control
- **Input Validation**: Data sanitization and validation
- **CORS Configuration**: Cross-origin request handling

## 🚀 Performance Features Tested

- **Response Caching**: Faster repeated requests
- **Connection Pooling**: Efficient database connections
- **Circuit Breaker**: Graceful service failure handling
- **Request/Response Logging**: Monitoring and debugging
- **Health Monitoring**: Service availability checks

## 🔍 Debugging Tips

### 1. Check Service Health

```bash
curl http://localhost:3000/api/health/services
```

### 2. View Gateway Logs

```bash
docker logs flux-gateway-api -f
```

### 3. Check Individual Service Logs

```bash
docker logs flux-auth-service -f
docker logs flux-user-service -f
# etc.
```

### 4. Common Issues

- **401 Unauthorized**: Check if `@accessToken` is valid
- **404 Not Found**: Verify resource IDs are correct
- **429 Rate Limited**: Wait before retrying
- **500 Server Error**: Check service logs for details

## 📈 Monitoring & Analytics

### Health Checks

- Gateway health: `GET /api/health`
- All services health: `GET /api/health/services`
- Individual service health via Gateway routing

### Performance Metrics

- Response times for each endpoint
- Success/error rates
- Rate limit hit rates
- File upload/download speeds

### Usage Analytics

- API endpoint usage patterns
- User activity tracking
- File storage usage
- Real-time connection metrics

---

## 🎉 Happy Testing!

This testing suite provides comprehensive coverage of all Flux API Gateway functionality. Each file is self-contained but designed to work together for full system testing.

For issues or questions, check the service logs and ensure all prerequisites are met before running tests.
