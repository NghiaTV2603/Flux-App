# Server Service

Flux Server Service - Quản lý servers và members trong hệ thống Discord-like.

## Chức năng chính

- Tạo và quản lý servers
- Quản lý members trong server
- Hệ thống invite codes
- Phân quyền (owner, admin, member)
- Tích hợp với RabbitMQ cho event-driven architecture

## API Endpoints

### Server Management

- `POST /servers` - Tạo server mới
- `GET /servers/:id` - Lấy thông tin server
- `PATCH /servers/:id` - Cập nhật server
- `DELETE /servers/:id` - Xóa server
- `GET /servers/user/:userId` - Lấy danh sách servers của user

### Invite System

- `POST /servers/join` - Tham gia server bằng invite code
- `POST /servers/:id/invite` - Tạo invite code mới

### Member Management

- `GET /servers/:id/members` - Lấy danh sách members
- `PATCH /servers/:id/members/:memberId` - Cập nhật thông tin member
- `DELETE /servers/:id/members/:memberId` - Xóa member khỏi server

## Database Schema

### Server
- id (UUID)
- name (String)
- description (String, optional)
- icon (String, optional)
- ownerId (String)
- inviteCode (String, unique)
- createdAt, updatedAt

### ServerMember
- id (UUID)
- serverId (UUID)
- userId (String)
- nickname (String, optional)
- role (String: owner/admin/member)
- joinedAt

## Environment Variables

```env
PORT=3003
DATABASE_URL=postgresql://user:password@localhost:5432/server_db
RABBITMQ_URL=amqp://localhost:5672
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e
```

## Docker

```bash
# Build image
docker build -t server-service .

# Run container
docker run -p 3003:3003 server-service
```
