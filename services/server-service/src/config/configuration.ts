export default () => ({
  port: parseInt(process.env.PORT, 10) || 3003,
  database: {
    url: process.env.DATABASE_URL,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  userService: {
    url: process.env.USER_SERVICE_URL || "http://localhost:3001",
  },
});
