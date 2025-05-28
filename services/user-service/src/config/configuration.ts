export default () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://flux_user:flux_password@localhost:5432/flux_user_db',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  rabbitmq: {
    url:
      process.env.RABBITMQ_URL ||
      'amqp://flux_user:flux_password@localhost:5672',
  },
});
