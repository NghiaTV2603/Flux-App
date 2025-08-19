import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

// Controllers - Updated for new architecture (6 services)
import { AppController } from './app.controller';
import { AuthController } from './controllers/auth.controller';
import { UserSocialController } from './controllers/user-social.controller';
import { ServerChannelController } from './controllers/server-channel.controller';
import { MessageController } from './controllers/message.controller';
import { MediaFileController } from './controllers/media-file.controller';
import { RealtimeController } from './controllers/realtime.controller';
import { HealthController } from './controllers/health.controller';

// Services
import { AppService } from './app.service';
import { ConfigService as CustomConfigService } from './config/config.service';
import { RedisService } from './redis/redis.service';
import { HttpClientService } from './services/http-client.service';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

// Middleware
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    UserSocialController,
    ServerChannelController,
    MessageController,
    MediaFileController,
    RealtimeController,
    HealthController,
  ],
  providers: [
    AppService,
    CustomConfigService,
    RedisService,
    HttpClientService,
    AuthGuard,
    RateLimitGuard,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
