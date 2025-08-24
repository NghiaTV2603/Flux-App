# Message Service

Flux Message Service - MongoDB-based microservice for real-time messaging with Discord-like features.

## Features

- **Unified Messaging**: Channel messages and direct messages in single collection
- **Real-time Communication**: WebSocket integration via RabbitMQ events
- **Rich Content**: Attachments, embeds, reactions, mentions, polls
- **Threading System**: Message threads with participant tracking
- **Performance Optimized**: MongoDB sharding, Redis caching, denormalized data
- **Discord-like Features**: Message reactions, mentions, edit history, pinning

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for hot data and real-time features
- **Message Queue**: RabbitMQ for event-driven architecture
- **Validation**: class-validator and class-transformer
- **Containerization**: Docker with multi-stage builds

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Start development server
npm run start:dev
```

## MongoDB Schema Design

### Core Collections

1. **messages** - Unified collection for all message types
   - Sharded by: `channel_id` || `conversation_id`
   - Features: Rich content, reactions, threads, edit history

2. **message_read_states** - User read states per channel/conversation
   - Sharded by: `user_id`
   - Embedded documents for performance

3. **message_threads** - Thread metadata and participants
   - Sharded by: `channel_id`
   - Auto-archive and permission support

4. **typing_indicators** - Real-time typing indicators (TTL: 10s)
   - Auto-cleanup with MongoDB TTL

5. **channel_presence** - User presence in channels (TTL: 5min)
   - Heartbeat-based presence tracking

## API Endpoints

### Channel Messages

```
POST   /api/v1/channels/:channelId/messages     # Create message
GET    /api/v1/channels/:channelId/messages     # Get messages
GET    /api/v1/channels/:channelId/search       # Search messages
```

### Direct Messages

```
POST   /api/v1/conversations/:conversationId/messages  # Create DM
GET    /api/v1/conversations/:conversationId/messages  # Get DMs
GET    /api/v1/conversations/:conversationId/search    # Search DMs
```

### Message Operations

```
GET    /api/v1/messages/:messageId              # Get single message
PUT    /api/v1/messages/:messageId              # Edit message
DELETE /api/v1/messages/:messageId              # Delete message
POST   /api/v1/messages/:messageId/reactions    # Add reaction
DELETE /api/v1/messages/:messageId/reactions/:emoji  # Remove reaction
POST   /api/v1/messages/:messageId/pin          # Pin message
DELETE /api/v1/messages/:messageId/pin          # Unpin message
```

## Event System

### Published Events

- `message.channel.sent` - New channel message
- `message.direct.sent` - New direct message
- `message.edited` - Message edited
- `message.deleted` - Message deleted
- `message.reaction.added` - Reaction added
- `message.reaction.removed` - Reaction removed
- `thread.created` - Thread created
- `notification.created` - Mention notifications

### Consumed Events

- `user.profile.updated` - Update denormalized user data
- `server.member.joined` - Handle new server members
- `channel.deleted` - Soft delete channel messages

## Performance Features

### Caching Strategy

- **Redis Cache**: Recent messages (50 per channel/conversation)
- **TTL Collections**: Typing indicators (10s), presence (5min)
- **Denormalized Data**: User info in messages for performance

### MongoDB Optimization

- **Compound Indexes**: Optimized for common query patterns
- **Sharding**: Geographic and load-based distribution
- **Text Search**: Full-text search on content and attachments
- **Pagination**: Cursor-based pagination with message numbers

### Scaling

- **Horizontal Sharding**: by channel/conversation/user
- **Geographic Distribution**: Multi-region support
- **Event-driven**: Async processing with RabbitMQ
- **Microservice Architecture**: Independent scaling

## Development

```bash
# Development
npm run start:dev

# Build
npm run build

# Testing
npm run test
npm run test:e2e

# Linting
npm run lint
npm run format
```

## Docker

```bash
# Build image
docker build -t flux-message-service .

# Run container
docker run -p 3005:3005 \
  -e DATABASE_URL=mongodb://localhost:27017/flux_message_db \
  -e REDIS_URL=redis://localhost:6379 \
  -e RABBITMQ_URL=amqp://localhost:5672 \
  flux-message-service
```

## Environment Variables

See `env.example` for all available configuration options.

## Integration with Other Services

- **User Service**: User profile data synchronization
- **Server Service**: Channel permissions validation
- **Realtime Service**: WebSocket event broadcasting
- **Gateway API**: Authentication and routing

## Database Indexes

Optimized indexes for common query patterns:

- Message pagination by channel/conversation
- User message history
- Search functionality
- Thread management
- Reaction tracking
- Mention lookups

## Monitoring & Health Checks

- Health check endpoint for container orchestration
- RabbitMQ connection monitoring
- MongoDB connection health
- Redis cache status

## Security

- Input validation with class-validator
- MongoDB injection prevention
- Rate limiting (handled by Gateway)
- JWT authentication (verified by Gateway)

## License

Private - Flux Application
