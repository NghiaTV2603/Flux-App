# Event Messages System - Diagrams

Thư mục này chứa các diagram mô tả hệ thống event messages cho ứng dụng Flux, bao gồm business flows, routing patterns, và monitoring strategies.

## 📁 Cấu trúc Files

### 🔄 System & Architecture

- **`system-overview.mmd`** - Tổng quan hệ thống event-driven architecture
- **`rabbitmq-routing.mmd`** - RabbitMQ routing patterns và queue bindings
- **`event-schema-structure.mmd`** - Cấu trúc base event schema và domain schemas

### 📋 Business Flows

- **`user-registration-flow.mmd`** - Flow đăng ký user và tạo profile
- **`friend-request-flow.mmd`** - Flow gửi/chấp nhận friend request và DM
- **`server-creation-flow.mmd`** - Flow tạo server và channels
- **`message-flow.mmd`** - Flow gửi tin nhắn và real-time communication
- **`voice-channel-flow.mmd`** - Flow voice chat và media sharing

### ⚙️ Technical Aspects

- **`event-versioning.mmd`** - Schema versioning strategy và compatibility
- **`error-handling-flow.mmd`** - Error handling, retry logic và circuit breaker
- **`monitoring-observability.mmd`** - Monitoring, metrics và alerting

## 🎯 Mục đích sử dụng

### 1. **Documentation**

- Tài liệu hóa event-driven architecture
- Giải thích business flows cho team
- Onboarding developers mới

### 2. **Design Reference**

- Reference cho việc implement event handlers
- Thiết kế routing keys và queue bindings
- Schema evolution planning

### 3. **Troubleshooting**

- Debug event flows khi có issues
- Hiểu dependencies giữa các services
- Phân tích performance bottlenecks

### 4. **Planning & Evolution**

- Planning cho features mới
- Impact analysis khi thay đổi schemas
- Capacity planning cho messaging infrastructure

## 🔧 Cách sử dụng

### Xem diagrams

```bash
# Sử dụng Mermaid CLI để render
npx @mermaid-js/mermaid-cli -i system-overview.mmd -o system-overview.png

# Hoặc sử dụng VS Code extension: Mermaid Preview
```

### Chỉnh sửa diagrams

1. Mở file `.mmd` trong VS Code
2. Cài đặt Mermaid extension để preview
3. Chỉnh sửa theo Mermaid syntax
4. Commit changes vào git

### Tích hợp vào docs

```markdown
# Trong markdown files

![System Overview](./diagrams/events/system-overview.mmd)

# Hoặc render thành image

![System Overview](./diagrams/events/system-overview.png)
```

## 📚 Event Types Reference

### 🔐 Authentication Events

```
auth.user.registered
auth.user.loginSucceeded
auth.user.loginFailed
auth.password.resetRequested
auth.password.resetCompleted
auth.token.refreshed
```

### 👤 User Events

```
user.profile.updated
user.status.changed
user.preferences.updated
```

### 👥 Social Events

```
social.friendRequest.sent
social.friendRequest.accepted
social.friendRequest.rejected
social.user.blocked
social.user.unblocked
```

### 🏠 Server Events

```
server.created
server.updated
server.deleted
server.member.joined
server.member.left
server.member.kicked
server.member.banned
server.channel.created
server.channel.updated
server.channel.deleted
server.role.created
server.role.updated
server.role.assigned
server.role.removed
```

### 💬 Message Events

```
message.channel.sent
message.direct.sent
message.updated
message.deleted
message.reaction.added
message.reaction.removed
```

### 📁 Media Events

```
media.file.uploaded
media.file.deleted
media.avatar.updated
```

### ⚡ Realtime Events

```
realtime.voice.sessionStarted
realtime.voice.sessionEnded
realtime.voice.settingsChanged
realtime.screen.shareStarted
realtime.screen.shareEnded
realtime.typing.started
realtime.typing.stopped
realtime.notification.created
```

## 🛠️ Development Guidelines

### Khi thêm event mới:

1. Update relevant flow diagram
2. Add routing key vào `rabbitmq-routing.mmd`
3. Define schema structure
4. Document trong README này

### Khi thay đổi existing events:

1. Check impact trong các flow diagrams
2. Update schema version nếu cần
3. Update monitoring metrics
4. Test backward compatibility

### Best Practices:

- Sử dụng past tense cho event names
- Include đầy đủ correlation IDs
- Design cho idempotency
- Consider schema evolution từ đầu
- Document breaking changes

## 📊 Monitoring & Metrics

### Key Metrics to Track:

- Event publishing rate by type
- Processing latency percentiles
- Error rates and retry counts
- Queue depths and backlog
- Schema version distribution

### Alert Thresholds:

- Error rate > 5%
- Queue depth > 1000 messages
- Processing latency p95 > 10s
- Dead letter queue accumulation

## 🔗 Related Documentation

- [Event Schemas](../../schemas/events/)
- [RabbitMQ Configuration](../../docker/rabbitmq/)
- [Service Implementation](../../services/)
- [API Documentation](../../docs/api/)
- [Monitoring Setup](../../monitoring/)

---

**Lưu ý**: Diagrams này được tạo bằng Mermaid syntax. Để xem preview, sử dụng VS Code với Mermaid extension hoặc render thành images.
