# Server Service API Documentation

## Tổng quan

Server Service cung cấp các API để quản lý servers, roles, channels và members với hệ thống permissions chi tiết.

## Các quyền cố định (Fixed Permissions)

### Quyền quản lý Channel

- `MANAGE_CHANNELS`: Tạo, sửa, xóa channels
- `MANAGE_CHANNEL_MEMBERS`: Thêm/xóa members vào/ra khỏi channels

### Quyền quản lý Member

- `MANAGE_MEMBERS`: Thêm/xóa members vào/ra khỏi server
- `MANAGE_ROLES`: Tạo, sửa, xóa roles

### Quyền cơ bản

- `VIEW_CHANNELS`: Xem public channels
- `SEND_MESSAGES`: Gửi tin nhắn trong channels
- `CONNECT_VOICE`: Kết nối vào voice channels
- `CREATE_INVITES`: Tạo server invites
- `MANAGE_SERVER`: Chỉnh sửa server settings

## Luồng tạo Server

Khi tạo server mới:

1. **Tự động tạo Owner role** với tất cả quyền
2. **Tự động tạo Members role** với quyền cơ bản
3. **Gán Owner role** cho người tạo server
4. **Tạo 2 channels mặc định**:
   - "general" (text channel, public)
   - "General" (voice channel, public)
5. **Thêm owner vào tất cả channels**

## API Endpoints

### Server Management

#### Tạo Server

```http
POST /servers?userId={userId}
Content-Type: application/json

{
  "name": "Server Name",
  "description": "Server description",
  "isPublic": false
}
```

#### Lấy thông tin Server

```http
GET /servers/{serverId}?userId={userId}
```

### Role Management

#### Lấy danh sách Roles

```http
GET /servers/{serverId}/roles?userId={userId}
```

#### Tạo Role mới

```http
POST /servers/{serverId}/roles?userId={userId}
Content-Type: application/json

{
  "name": "Role Name",
  "color": "#00ff00",
  "position": 50,
  "permissions": [
    "MANAGE_CHANNELS",
    "MANAGE_CHANNEL_MEMBERS",
    "VIEW_CHANNELS"
  ],
  "isHoisted": true,
  "isMentionable": true
}
```

#### Cập nhật Role

```http
PATCH /servers/{serverId}/roles/{roleId}?userId={userId}
Content-Type: application/json

{
  "name": "Updated Role Name",
  "permissions": ["VIEW_CHANNELS", "SEND_MESSAGES"]
}
```

#### Xóa Role

```http
DELETE /servers/{serverId}/roles/{roleId}?userId={userId}
```

#### Gán Role cho Member

```http
POST /servers/{serverId}/members/{memberId}/roles/{roleId}?userId={userId}
```

#### Bỏ Role khỏi Member

```http
DELETE /servers/{serverId}/members/{memberId}/roles/{roleId}?userId={userId}
```

### Channel Management

#### Lấy danh sách Channels

```http
GET /servers/{serverId}/channels?userId={userId}
```

#### Tạo Channel mới

```http
POST /servers/{serverId}/channels?userId={userId}
Content-Type: application/json

{
  "name": "channel-name",
  "type": "text", // "text" | "voice"
  "topic": "Channel description",
  "position": 1,
  "isPrivate": false,
  "isNsfw": false,
  "slowmodeDelay": 0,
  "userLimit": 10, // cho voice channel
  "bitrate": 64000 // cho voice channel
}
```

#### Cập nhật Channel

```http
PATCH /servers/{serverId}/channels/{channelId}?userId={userId}
Content-Type: application/json

{
  "name": "updated-name",
  "topic": "Updated description"
}
```

#### Xóa Channel

```http
DELETE /servers/{serverId}/channels/{channelId}?userId={userId}
```

### Channel Member Management

#### Lấy danh sách Members trong Channel

```http
GET /servers/{serverId}/channels/{channelId}/members?userId={userId}
```

#### Thêm Member vào Channel (Private channels)

```http
POST /servers/{serverId}/channels/{channelId}/members?userId={userId}
Content-Type: application/json

{
  "targetUserId": "user-id-to-add"
}
```

#### Xóa Member khỏi Channel

```http
DELETE /servers/{serverId}/channels/{channelId}/members/{targetUserId}?userId={userId}
```

## Logic Permissions

### Channel Access Rules

#### Public Channels

- Tất cả members trong server đều được tự động thêm vào
- Có thể xem và tham gia mà không cần invite

#### Private Channels

- Chỉ những người có quyền `MANAGE_CHANNELS` mới được tự động thêm vào
- Members khác cần được invite bởi người có quyền `MANAGE_CHANNEL_MEMBERS`
- Để xem private channel, user phải:
  - Có quyền `MANAGE_CHANNELS`, HOẶC
  - Được thêm vào channel đó

### Role Hierarchy

1. **Owner Role** (position: 100)
   - Có tất cả permissions
   - Không thể bị xóa hoặc chỉnh sửa
   - Chỉ có 1 owner per server

2. **Custom Roles** (position: 1-99)
   - Có thể tạo với bất kỳ combination permissions nào
   - Có thể chỉnh sửa và xóa bởi người có quyền `MANAGE_ROLES`

3. **Members Role** (position: 0)
   - Role mặc định cho tất cả members
   - Có permissions cơ bản: `VIEW_CHANNELS`, `SEND_MESSAGES`, `CONNECT_VOICE`
   - Không thể bị xóa

### Permission Checking

Permissions của user được tính bằng cách OR tất cả permissions từ các roles mà user có:

```
User Permissions = Role1.permissions | Role2.permissions | ... | RoleN.permissions
```

## Error Handling

### Common Error Responses

#### 403 Forbidden

- Không có quyền thực hiện action
- Ví dụ: Cố gắng tạo role mà không có quyền `MANAGE_ROLES`

#### 404 Not Found

- Server, role, channel hoặc member không tồn tại
- User không phải member của server

#### 409 Conflict

- Role đã được assign cho member
- User đã là member của channel
- Tên role/channel đã tồn tại trong server

## Events (RabbitMQ)

Service sẽ publish các events sau:

### Server Events

- `server.created`: Khi server được tạo
- `server.updated`: Khi server được cập nhật
- `server.deleted`: Khi server được xóa

### Member Events

- `server.member.joined`: Khi member join server
- `server.member.left`: Khi member rời server
- `server.member.updated`: Khi thông tin member được cập nhật

### Channel Events

- `server.channel.created`: Khi channel được tạo
- `server.channel.updated`: Khi channel được cập nhật
- `server.channel.deleted`: Khi channel được xóa

## Testing

Sử dụng file `test-server-roles-api.http` để test các endpoints với các scenarios khác nhau.

### Test Scenarios

1. **Happy Path**: Tạo server, roles, channels và quản lý members
2. **Permission Denied**: Test các trường hợp không có quyền
3. **Edge Cases**: Test với data invalid, resources không tồn tại

### Prerequisites

- Database phải được setup và migrate
- RabbitMQ service phải đang chạy (optional, service vẫn hoạt động nếu không có)
- Server service phải đang chạy trên port 3002
