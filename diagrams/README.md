# Flux System Diagrams

Tập hợp các diagrams mô tả architecture và event flows của hệ thống Flux với CQRS + Event Sourcing.

## 📁 Organization

```
diagrams/
├── README.md              # This file
├── architecture/          # System architecture diagrams
│   ├── system-overview.*  # Overall system architecture (legacy)
│   └── cqrs-overview.*    # CQRS + Event Sourcing architecture
├── database/              # Database schema diagrams
│   ├── auth-service-schema.*     # Auth Service database schema
│   ├── user-service-schema.*     # User Service database schema
│   ├── server-service-schema.*   # Server Service database schema
│   ├── message-service-schema.*  # Message Service database schema (MongoDB)
│   └── social-service-schema.*   # Social Service database schema
└── flows/                 # Event flow diagrams
    ├── user-registration.*       # User registration event flow
    ├── profile-update.*          # Profile update event flow
    ├── username-sync.*           # Username synchronization flow
    ├── event-sourcing-flow.*     # CQRS + Event Sourcing flow
    └── api-composition-pattern.* # API Composition Pattern flow
```

## 🏗️ Architecture Diagrams

### CQRS Overview (NEW)

**File**: `architecture/cqrs-overview`  
**Description**: Modern CQRS + Event Sourcing architecture với Command/Query separation.

**Key Components Shown**:

- **Command Side**: Write services với dedicated write databases
- **Query Side**: Read models với materialized views và caching
- **Event Store**: Centralized event storage cho audit trail
- **Message Queue**: RabbitMQ cho event-driven communication
- **Cache Layer**: Redis cluster cho performance optimization

**Technologies**: PostgreSQL, MongoDB, Redis, Elasticsearch, ClickHouse, Neo4j

### System Overview (Legacy)

**File**: `architecture/system-overview`  
**Description**: High-level view của original system architecture (kept for reference).

**Key Features Shown**:

- Service communication patterns
- Database relationships
- Event flow directions
- Port configurations

---

## 🗄️ Database Schema Diagrams

### 1. Auth Service Schema

**File**: `database/auth-service-schema`  
**Description**: Authentication service database schema với security features.

**Tables**:

- `users` - Core user authentication data
- `oauth_providers` - OAuth integration (Google, Facebook, etc.)
- `user_sessions` - Session management với device tracking
- `password_resets` - Password reset token management
- `rate_limits` - Rate limiting per user/endpoint

**Key Features**:

- Optimistic locking với version fields
- Comprehensive indexing cho performance
- Security-focused design

### 2. User Service Schema

**File**: `database/user-service-schema`  
**Description**: User profile và settings management với CQRS read models.

**Tables**:

- `user_profiles` - User profile data với full-text search
- `user_settings` - User preferences và privacy settings
- `user_activities` - Rich presence và activity tracking
- `user_analytics` - Partitioned analytics data
- `user_directory` - Materialized view cho user discovery

**Key Features**:

- Data denormalization từ auth service
- PostgreSQL full-text search với tsvector
- Monthly partitioning cho analytics
- Read models cho performance

### 3. Server Service Schema

**File**: `database/server-service-schema`  
**Description**: Server, channel, và role management với embedded permissions.

**Tables**:

- `servers` - Discord-like server management
- `server_members` - Member data với embedded roles
- `channels` - Text/Voice channels với hierarchy
- `server_roles` - Role definitions và permissions
- `channel_members` - Channel membership tracking
- Read models: `server_directory`, `user_servers`

**Key Features**:

- Embedded role data trong server_members cho performance
- Channel hierarchy với parent-child relationships
- Computed unread counts trong read models
- Full-text search cho server discovery

### 4. Message Service Schema

**File**: `database/message-service-schema`  
**Description**: MongoDB-based message storage với sharding và read models.

**Collections**:

- `messages` - Channel messages với sharding
- `direct_messages` - Private conversations
- `message_threads` - Thread management
- Read models: Elasticsearch index, ClickHouse analytics

**Key Features**:

- MongoDB sharding theo channel_id
- Rich message features: reactions, mentions, embeds
- Elasticsearch integration cho full-text search
- ClickHouse cho analytics và metrics

### 5. Social Service Schema

**File**: `database/social-service-schema`  
**Description**: Friend relationships với PostgreSQL + Neo4j graph database.

**Tables**:

- `friendships` - Friend relationships và statuses
- `friend_lists_cache` - Denormalized friend data
- `blocks` - User blocking functionality
- `friend_suggestions` - AI-powered friend recommendations
- Read models: `friend_stats`, `social_graph`

**Key Features**:

- Neo4j integration cho friend recommendations
- Precomputed social graphs
- AI confidence scores cho suggestions
- Comprehensive friend management

---

## 🔄 Event Flow Diagrams

### 1. User Registration Flow

**File**: `flows/user-registration`  
**Description**: Complete user registration process với event-driven profile creation.

**Flow Steps**:

1. Client gửi registration request
2. Auth Service tạo user record trong database
3. Publish `user.created` event to RabbitMQ
4. User Service consume event và tạo user profile
5. Return tokens to client

**Key Events**: `user.created`

### 2. Profile Update Flow

**File**: `flows/profile-update`  
**Description**: User profile update process với notification propagation.

**Flow Steps**:

1. Client update profile via Gateway
2. User Service update database
3. Publish `profile.updated` event
4. Notification Service (future) gửi alerts đến friends
5. Return success response

**Key Events**: `profile.updated`

### 3. Username Sync Flow

**File**: `flows/username-sync`  
**Description**: Username synchronization giữa Auth Service và User Service.

**Flow Steps**:

1. Username changed trong Auth Service
2. Publish `user.updated` event với new username
3. User Service consume event và sync username
4. Data consistency achieved across services

**Key Events**: `user.updated`

### 4. Event Sourcing Flow (NEW)

**File**: `flows/event-sourcing-flow`  
**Description**: Complete CQRS + Event Sourcing workflow từ command đến query.

**Flow Steps**:

1. **Command Side**: Client → Gateway → Service → Write DB → Event Store
2. **Event Processing**: Event Store → RabbitMQ → Projection Services
3. **Read Model Updates**: Parallel updates to multiple read models
4. **Query Side**: Client queries optimized read models
5. **Event Replay**: System recovery thông qua event replay

**Key Benefits**:

- Write side tối ưu cho consistency
- Read side tối ưu cho performance
- Complete audit trail
- System recovery capabilities

### 5. API Composition Pattern (NEW)

**File**: `flows/api-composition-pattern`  
**Description**: Gateway orchestrates multiple services cho single client request.

**Flow Steps**:

1. **Single Request**: Client gửi complex request đến Gateway
2. **Parallel Calls**: Gateway calls multiple services simultaneously
3. **Data Composition**: Gateway combines responses thành unified format
4. **Error Handling**: Circuit breaker pattern và fallback strategies
5. **Caching**: Multi-level caching cho performance

**Key Benefits**:

- Reduced network overhead
- Fault tolerance
- Consistent API interface
- Service autonomy

---

## 🎨 Diagram Types & Formats

### Architecture Diagrams

- **Tool**: Mermaid
- **Format**: `.mmd` source files
- **Use Case**: System overview, CQRS architecture
- **Style**: Graph-based với color coding và clear labels

### Database Schema Diagrams

- **Tool**: Mermaid (ER Diagram)
- **Format**: `.mmd` source files
- **Use Case**: Database design, relationships, indexes
- **Style**: Entity-relationship với detailed field specifications

### Sequence Diagrams

- **Tool**: Mermaid
- **Format**: `.mmd` source files
- **Use Case**: Event flows, service interactions, CQRS flows
- **Style**: Detailed với participant labels, notes, và parallel operations

---

## 🔄 Usage Guidelines

### For Developers

1. **Understanding Architecture**: Start với `cqrs-overview` diagram
2. **Database Design**: Reference schema diagrams khi implement services
3. **Event Flows**: Use sequence diagrams để understand cross-service interactions
4. **Debugging**: Trace issues using event sourcing flow diagram

### For Database Design

1. **Schema Reference**: Use schema diagrams cho table design
2. **Indexing Strategy**: Follow indexing recommendations trong schemas
3. **Read Models**: Understand materialized view strategies
4. **Partitioning**: Apply partitioning strategies cho analytics tables

### For System Integration

1. **API Composition**: Follow composition pattern cho complex queries
2. **Event Sourcing**: Implement event sourcing using provided flows
3. **CQRS Implementation**: Separate command/query responsibilities
4. **Cross-Service Communication**: Use RabbitMQ event patterns

---

## 📋 Maintenance

### Adding New Diagrams

1. Create `.mmd` file trong appropriate folder
2. Add entry to this README với detailed description
3. Update main ARCHITECTURE-DESIGN.md references
4. Include key benefits và use cases

### Updating Database Schemas

1. Modify schema `.mmd` files khi có database changes
2. Update indexes và constraints
3. Document migration strategies
4. Update read model projections

### Diagram Standards

- **Naming**: Use kebab-case for file names
- **Labels**: Clear, concise entity/node names
- **Documentation**: Detailed field descriptions trong schemas
- **Colors**: Consistent color scheme for service types
- **Relationships**: Clear relationship notation

---

## 🛠️ Tools & Resources

### Mermaid Resources

- [Mermaid Documentation](https://mermaid-js.github.io/mermaid/)
- [ER Diagram Syntax](https://mermaid-js.github.io/mermaid/#/entityRelationshipDiagram)
- [Sequence Diagram Syntax](https://mermaid-js.github.io/mermaid/#/sequenceDiagram)
- [Graph Diagram Syntax](https://mermaid-js.github.io/mermaid/#/graph)

### Database Design Tools

- **PostgreSQL**: pgAdmin, DBeaver for schema management
- **MongoDB**: MongoDB Compass for collection design
- **Redis**: RedisInsight for cache optimization
- **Elasticsearch**: Kibana for index management

### Development Tools

- **VS Code**: Mermaid Preview extension
- **CLI**: `@mermaid-js/mermaid-cli` for batch conversion
- **Online**: [Mermaid Live Editor](https://mermaid.live/)

---

## 🚀 Implementation Roadmap

### Phase 1: Core CQRS Infrastructure

- [ ] Event Store implementation
- [ ] Message queue setup (RabbitMQ)
- [ ] Basic projection services
- [ ] Gateway API composition layer

### Phase 2: Service Migration

- [ ] Auth Service với new schema
- [ ] User Service với read models
- [ ] Server Service consolidation
- [ ] Message Service với MongoDB sharding

### Phase 3: Advanced Features

- [ ] Social Service với Neo4j
- [ ] Analytics với ClickHouse
- [ ] Full-text search với Elasticsearch
- [ ] Advanced caching strategies

### Phase 4: Optimization

- [ ] Performance tuning
- [ ] Monitoring và alerting
- [ ] Horizontal scaling
- [ ] Production deployment

---

**Last Updated**: January 2025  
**Architecture Version**: 2.0 (CQRS + Event Sourcing)  
**Maintained by**: Development Team
