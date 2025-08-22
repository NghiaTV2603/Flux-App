# 🔧 Hướng Dẫn Test APIs - Xử Lý Variables

## ⚠️ Vấn Đề Với HTTP Client Variables

Khi bạn thấy **lỗi đỏ** ở các dòng như:

```http
@accessToken = {{login.response.body.accessToken}}
```

**Nguyên nhân:** VS Code HTTP Client không thể resolve variables từ responses chưa được execute.

## ✅ Cách Sửa - 2 Phương Pháp

### **Phương Pháp 1: Manual Copy-Paste (Khuyên dùng)**

#### Bước 1: Chạy Login Request

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Bước 2: Copy Token từ Response

Response sẽ trả về:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Bước 3: Paste Token vào Variable

```http
# Thay thế:
@accessToken = paste-your-actual-token-here

# Với token thực:
@accessToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Phương Pháp 2: REST Client Extension**

Nếu dùng REST Client extension, có thể sử dụng:

```http
### Login
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Sử dụng response từ request trên
@accessToken = {{login.response.body.$.accessToken}}

### Test với token
GET http://localhost:3002/users/123
Authorization: Bearer {{accessToken}}
```

## 🚀 Workflow Testing Đúng Cách

### 1. **Khởi động Services**

```bash
docker-compose up -d
# Đợi ~30s cho services ready
```

### 2. **Test Health Checks**

```http
GET http://localhost:3000/health  # Gateway
GET http://localhost:3001/health  # Auth
GET http://localhost:3002/health  # User
GET http://localhost:3003/health  # Server
```

### 3. **Authentication Flow**

```http
# 1. Register user
POST http://localhost:3001/auth/register
Content-Type: application/json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123"
}

# 2. Login and get token
POST http://localhost:3001/auth/login
Content-Type: application/json
{
  "email": "test@example.com",
  "password": "password123"
}

# 3. Copy accessToken từ response
# 4. Update variable:
@accessToken = your-actual-token-here
```

### 4. **Test Other Services**

```http
# Với token đã có, test các endpoints khác
GET http://localhost:3002/users/test@example.com
Authorization: Bearer {{accessToken}}
```

## 📝 Template Variables Chuẩn

### **Auth Service Variables**

```http
@baseUrl = http://localhost:3001
@testEmail = test@example.com
@testPassword = password123
@accessToken = paste-token-after-login
@refreshToken = paste-refresh-token-after-login
```

### **User Service Variables**

```http
@baseUrl = http://localhost:3002
@testUserId = test-user-123
@authToken = paste-jwt-token-here
```

### **Server Service Variables**

```http
@baseUrl = http://localhost:3003
@testUserId = test-user-123
@serverId = paste-server-id-after-creation
@channelId = paste-channel-id-after-creation
@roleId = paste-role-id-after-creation
```

### **Gateway API Variables**

```http
@baseUrl = http://localhost:3000
@testEmail = gateway@example.com
@testPassword = password123
@accessToken = paste-token-after-login
@testUserId = test-user-123
```

## 🔄 Dynamic Variables vs Static Variables

### **Static Variables** (Luôn hoạt động)

```http
@baseUrl = http://localhost:3000
@testEmail = test@example.com
@userId = test-user-123
```

### **Dynamic Variables** (Cần manual update)

```http
# ❌ Sẽ báo lỗi đỏ:
@token = {{login.response.body.accessToken}}

# ✅ Hoạt động tốt:
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛠️ Debug Tips

### **Khi Variables Không Hoạt Động:**

1. ✅ Check syntax: `@variableName = value`
2. ✅ Không có spaces thừa
3. ✅ Variable được define trước khi sử dụng
4. ✅ Copy token chính xác (không thiếu ký tự)

### **Khi Token Hết Hạn:**

```http
# Test token còn hiệu lực:
GET http://localhost:3002/users/123
Authorization: Bearer {{accessToken}}

# Nếu 401 Unauthorized, login lại và update token
```

### **Khi Services Không Response:**

```bash
# Check containers
docker ps

# Check logs
docker-compose logs -f auth-service

# Restart if needed
docker-compose restart
```

## 📊 Expected Response Format

### **Login Success Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

### **Error Response:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid credentials"
}
```

## 🎯 Pro Tips

### **Tối Ưu Workflow:**

1. **Tạo 1 file variables riêng** cho session hiện tại
2. **Group các requests** theo workflow logic
3. **Comment rõ ràng** từng bước
4. **Save responses** để reference sau này

### **Security Best Practices:**

- ⚠️ **Không commit** tokens vào git
- 🔄 **Refresh tokens** thường xuyên
- 🛡️ **Test với nhiều user** khác nhau
- 📝 **Log errors** để debug

### **Performance Testing:**

- ⏱️ Monitor response times
- 📊 Test với concurrent requests
- 🚀 Verify rate limiting
- 💾 Check memory usage

---

**Tóm lại:** Lỗi đỏ là bình thường khi variables reference chưa có response. Sử dụng manual copy-paste tokens là cách đơn giản và hiệu quả nhất! 🎉
