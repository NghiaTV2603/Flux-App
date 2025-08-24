export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  database: {
    url:
      process.env.DATABASE_URL ||
      'mongodb://flux_user:flux_password@localhost:27017/flux_message_db',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  rabbitmq: {
    url:
      process.env.RABBITMQ_URL ||
      'amqp://flux_user:flux_password@localhost:5672',
  },
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    serverService:
      process.env.SERVER_SERVICE_URL || 'http://server-service:3003',
    realtimeService:
      process.env.REALTIME_SERVICE_URL || 'http://realtime-service:3006',
  },
  security: {
    jwtSecret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },
  features: {
    enableSearch: process.env.ENABLE_SEARCH === 'true',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '2000', 10),
    maxAttachments: parseInt(process.env.MAX_ATTACHMENTS || '10', 10),
  },
});
