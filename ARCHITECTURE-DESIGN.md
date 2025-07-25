# Flux - Event-Driven Architecture Design

## 📖 Tổng quan

Document này mô tả chi tiết thiết kế event-driven architecture của hệ thống Flux, bao gồm service communication patterns, database relationships, và message queue flows.

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Active Development

---

## 🏗️ System Architecture Overview

### Core Principles

- **Database Per Service**: Mỗi microservice có database riêng biệt
- **Event-Driven Communication**: Services giao tiếp qua RabbitMQ events
- **Eventual Consistency**: Data consistency qua event synchronization
- **Fault Tolerance**: Error handling không ảnh hưởng đến core business logic

### Service Architecture

![System Architecture](diagrams/architecture/system-overview.mmd)

**Diagram File**: [`diagrams/architecture/system-overview.mmd`](diagrams/architecture/system-overview.mmd)

---

## 🗄️ Database Design & Relationships

### 1. Auth Service Database (`flux_auth_db`)

```sql
-- Core authentication tables
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE,
  username: VARCHAR UNIQUE,
  password_hash: VARCHAR,
  is_verified: BOOLEAN DEFAULT false,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

oauth_providers (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  provider: VARCHAR, -- 'google', 'facebook'
  provider_id: VARCHAR,
  UNIQUE(provider, provider_id)
)

refresh_tokens (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  token: VARCHAR UNIQUE,
  expires_at: TIMESTAMP,
  created_at: TIMESTAMP
)

password_resets (
  id: UUID PRIMARY KEY,
  email: VARCHAR,
  token: VARCHAR UNIQUE,
  expires_at: TIMESTAMP,
  used: BOOLEAN DEFAULT false,
  created_at: TIMESTAMP
)
```

### 2. User Service Database (`flux_user_db`)

```sql
-- User profile and settings
user_profiles (
  user_id: UUID PRIMARY KEY, -- References auth.users.id
  username: VARCHAR UNIQUE,  -- Cached from auth service
  avatar: VARCHAR,
  status: VARCHAR DEFAULT 'offline',
  custom_status: VARCHAR,
  bio: VARCHAR,
  display_name: VARCHAR,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

user_settings (
  id: UUID PRIMARY KEY,
  user_id: UUID UNIQUE,      -- References user_profiles.user_id
  theme: VARCHAR DEFAULT 'dark',
  language: VARCHAR DEFAULT 'en',
  notifications_enabled: BOOLEAN DEFAULT true,
  sound_enabled: BOOLEAN DEFAULT true,
  show_online_status: BOOLEAN DEFAULT true,
  allow_direct_messages: BOOLEAN DEFAULT true,
  allow_friend_requests: BOOLEAN DEFAULT true
)

user_activities (
  id: UUID PRIMARY KEY,
  user_id: UUID,             -- References user_profiles.user_id
  activity: VARCHAR,         -- 'playing', 'listening', 'watching'
  name: VARCHAR,
  details: VARCHAR,
  state: VARCHAR,
  start_time: TIMESTAMP DEFAULT now(),
  end_time: TIMESTAMP
)
```

### 🔗 Cross-Service Relationships

**Key Design Decision**: Sử dụng `user_id` làm foreign key reference thay vì database-level constraints để maintain service independence.

```
Auth.users.id ──┐
                ├─ (Event-driven sync)
                └─> User.user_profiles.user_id
```

---

## 🚀 Event-Driven Communication

### RabbitMQ Configuration

**Exchange**: `app.events` (type: topic)  
**Routing Pattern**: `{service}.{action}.{entity}`

```yaml
Exchange:
  name: app.events
  type: topic
  durable: true

Queues:
  user.service.queue:
    durable: true
    bindings: ["user.*"]

  # Future queues
  notification.service.queue:
    bindings: ["user.*", "message.*", "server.*"]
  server.service.queue:
    bindings: ["user.*", "server.*"]
```

### 📨 Event Types & Schemas

#### 1. User Events

```typescript
// Published by Auth Service
interface UserCreatedEvent {
  routingKey: "user.created";
  payload: {
    userId: string;
    username: string;
    email: string;
    timestamp: number;
  };
}

interface UserUpdatedEvent {
  routingKey: "user.updated";
  payload: {
    userId: string;
    username?: string; // If username changed
    email?: string; // If email changed
    timestamp: number;
  };
}

interface UserDeletedEvent {
  routingKey: "user.deleted";
  payload: {
    userId: string;
    timestamp: number;
  };
}
```

#### 2. Future Event Types

```typescript
// Profile Events (Published by User Service)
interface ProfileUpdatedEvent {
  routingKey: "profile.updated";
  payload: {
    userId: string;
    changes: {
      displayName?: string;
      avatar?: string;
      bio?: string;
      status?: string;
    };
    timestamp: number;
  };
}

// Server Events
interface ServerCreatedEvent {
  routingKey: "server.created";
  payload: {
    serverId: string;
    ownerId: string;
    name: string;
    timestamp: number;
  };
}

// Message Events
interface MessageSentEvent {
  routingKey: "message.sent";
  payload: {
    messageId: string;
    authorId: string;
    channelId?: string; // For channel messages
    recipientId?: string; // For DMs
    content: string;
    timestamp: number;
  };
}
```

---

## 🔄 Service Communication Flows

### 1. User Registration Flow

![User Registration Flow](diagrams/flows/user-registration.mmd)

**Diagram File**: [`diagrams/flows/user-registration.mmd`](diagrams/flows/user-registration.mmd)

**Flow Description**: Complete user registration process với event-driven profile creation.

### 2. Profile Update Flow

![Profile Update Flow](diagrams/flows/profile-update.mmd)

**Diagram File**: [`diagrams/flows/profile-update.mmd`](diagrams/flows/profile-update.mmd)

**Flow Description**: User profile update process với notification propagation.

### 3. Username Change Sync Flow

![Username Sync Flow](diagrams/flows/username-sync.mmd)

**Diagram File**: [`diagrams/flows/username-sync.mmd`](diagrams/flows/username-sync.mmd)

**Flow Description**: Username synchronization giữa Auth Service và User Service.

---

## 🛡️ Error Handling & Resilience

### Event Publishing Strategies

```typescript
// In Auth Service
async publishUserEvent(event: UserEvent) {
  try {
    await this.rabbitMQService.publishEvent(event);
    this.logger.log(`Event published: ${event.type}`);
  } catch (error) {
    this.logger.error('Event publishing failed:', error);

    // Option 1: Store in local outbox table for retry
    await this.outboxService.store(event);

    // Option 2: Continue operation (eventual consistency)
    // Don't fail the main business operation
  }
}
```

### Consumer Error Handling

```typescript
// In User Service
async handleEvent(message: ConsumeMessage) {
  try {
    await this.processEvent(message);
    this.channel.ack(message); // Success
  } catch (error) {
    this.logger.error('Event processing failed:', error);

    if (this.isRetryableError(error)) {
      // Retry logic with exponential backoff
      this.channel.nack(message, false, true); // Requeue
    } else {
      // Dead letter queue for manual investigation
      this.channel.nack(message, false, false); // Don't requeue
      await this.deadLetterService.store(message, error);
    }
  }
}
```

### Data Consistency Patterns

**1. Eventual Consistency**

- Primary operation succeeds immediately
- Secondary operations happen asynchronously via events
- Temporary inconsistencies are acceptable

**2. Saga Pattern** (Future implementation)

- For complex multi-service transactions
- Compensating actions for rollback

**3. Outbox Pattern** (Future implementation)

- Store events in same transaction as business data
- Separate process publishes events to message queue

---

## 📈 Future Improvements & Roadmap

### Phase 1: Enhanced Reliability

- [ ] **Outbox Pattern**: Store events locally before publishing
- [ ] **Dead Letter Queue**: Handle failed events
- [ ] **Event Replay**: Ability to replay events for recovery
- [ ] **Health Checks**: Monitor RabbitMQ connectivity

### Phase 2: Advanced Patterns

- [ ] **Event Sourcing**: Store events as source of truth
- [ ] **CQRS**: Separate read/write models
- [ ] **Saga Pattern**: Complex transaction management
- [ ] **Event Versioning**: Handle schema evolution

### Phase 3: Monitoring & Observability

- [ ] **Event Tracking**: Trace events across services
- [ ] **Metrics**: Message queue metrics and alerts
- [ ] **Event Dashboard**: Real-time event monitoring
- [ ] **Audit Logs**: Complete event audit trail

### Phase 4: Performance Optimization

- [ ] **Event Batching**: Batch multiple events
- [ ] **Message Compression**: Reduce bandwidth
- [ ] **Partitioning**: Scale message processing
- [ ] **Caching Layer**: Cache frequently accessed data

---

## 🧪 Testing Strategies

### Unit Testing

```typescript
// Test event publishing
describe("AuthService", () => {
  it("should publish user.created event on registration", async () => {
    const mockRabbitMQ = jest.fn();
    // Test implementation
  });
});

// Test event consumption
describe("UserService", () => {
  it("should create profile on user.created event", async () => {
    const event = { userId: "test", username: "test" };
    // Test implementation
  });
});
```

### Integration Testing

```typescript
// Test complete flow
describe("User Registration Flow", () => {
  it("should create user and profile via events", async () => {
    // 1. Register user via Auth Service
    // 2. Verify event published to RabbitMQ
    // 3. Verify profile created in User Service
    // 4. Verify data consistency
  });
});
```

### Event Contract Testing

- Validate event schemas don't break consumers
- Test backward compatibility
- Validate routing key patterns

---

## 📚 References & Resources

### Documentation

- [RabbitMQ Best Practices](https://www.rabbitmq.com/best-practices.html)
- [Microservices Patterns - Chris Richardson](https://microservices.io/patterns/)
- [Event-Driven Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven)

### Tools & Libraries

- **amqplib**: RabbitMQ client for Node.js
- **Prisma**: Database ORM
- **NestJS**: Framework with built-in dependency injection

### Monitoring Tools (Future)

- **Jaeger**: Distributed tracing
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **ELK Stack**: Centralized logging

---

## 📊 Visual References

### 📁 Diagram Files

Tất cả visual diagrams được lưu trong thư mục [`diagrams/`](diagrams/) với organization structure rõ ràng:

- **Architecture Diagrams**: [`diagrams/architecture/`](diagrams/architecture/)

  - [`system-overview.mmd`](diagrams/architecture/system-overview.mmd) - Complete system architecture

- **Flow Diagrams**: [`diagrams/flows/`](diagrams/flows/)
  - [`user-registration.mmd`](diagrams/flows/user-registration.mmd) - User registration với event flow
  - [`profile-update.mmd`](diagrams/flows/profile-update.mmd) - Profile update với notifications
  - [`username-sync.mmd`](diagrams/flows/username-sync.mmd) - Cross-service username sync

### 🎨 Viewing Diagrams

**Online Viewers**:

- [Mermaid Live Editor](https://mermaid.live/) - Copy paste `.mmd` content để view
- VS Code với Mermaid Preview extension
- GitHub/GitLab - Automatic rendering của `.mmd` files

**Export Options**:

- SVG: High-quality vector graphics
- PNG: Raster images cho presentations
- PDF: Document inclusion

### 📋 Diagram Maintenance

- **Source Files**: Always update `.mmd` files when architecture changes
- **Documentation**: Keep this document synced với diagram content
- **Version Control**: Commit diagram changes với related code changes

---

## 🔄 Version History

| Version | Date     | Changes                       | Author |
| ------- | -------- | ----------------------------- | ------ |
| 1.0     | Jan 2025 | Initial architecture design   | System |
|         |          | - Basic event-driven patterns |        |
|         |          | - User registration flow      |        |
|         |          | - Database design             |        |
|         |          | - **Added visual diagrams**   |        |

---

**💡 Note**: Đây là living document sẽ được cập nhật khi có thay đổi architecture hoặc thêm features mới.
