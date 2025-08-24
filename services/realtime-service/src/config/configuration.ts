export default () => ({
  port: parseInt(process.env.PORT || '3006', 10),
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://flux_user:flux_password@localhost:5433/flux_realtime_db',
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
  websocket: {
    cors: {
      origin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  },
  services: {
    messageService: process.env.MESSAGE_SERVICE_URL || 'http://localhost:3005',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    serverService: process.env.SERVER_SERVICE_URL || 'http://localhost:3003',
  },
});
