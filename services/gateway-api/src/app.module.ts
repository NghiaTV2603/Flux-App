import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

// Controllers
import { AppController } from './app.controller';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { ServerController } from './controllers/server.controller';
import { ChannelController } from './controllers/channel.controller';
import { FriendController } from './controllers/friend.controller';
import { DirectMessageController } from './controllers/dm.controller';
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
    UserController,
    ServerController,
    ChannelController,
    FriendController,
    DirectMessageController,
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
