import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configuration
import configuration from './config/configuration';

// Modules
import { DatabaseModule } from './database/database.module';
import { MessageModule } from './message/message.module';

// Services
import { RedisService } from './redis/redis.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { UserClientService } from './services/user-client.service';

// Middleware
import { UserExtractionMiddleware } from './middleware/user-extraction.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('security.jwtSecret') ||
          'your-super-secret-jwt-key-change-in-production',
        signOptions: {
          expiresIn: '1h',
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService, RabbitMQService, UserClientService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserExtractionMiddleware).forRoutes('*'); // Apply to all routes
  }
}
