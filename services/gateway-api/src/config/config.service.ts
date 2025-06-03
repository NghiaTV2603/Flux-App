import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'your-secret-key');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1h');
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get authServiceUrl(): string {
    return this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  get userServiceUrl(): string {
    return this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  get serverServiceUrl(): string {
    return this.configService.get<string>(
      'SERVER_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  get channelServiceUrl(): string {
    return this.configService.get<string>(
      'CHANNEL_SERVICE_URL',
      'http://localhost:3004',
    );
  }

  get messageServiceUrl(): string {
    return this.configService.get<string>(
      'MESSAGE_SERVICE_URL',
      'http://localhost:3005',
    );
  }

  get friendServiceUrl(): string {
    return this.configService.get<string>(
      'FRIEND_SERVICE_URL',
      'http://localhost:3006',
    );
  }

  get dmServiceUrl(): string {
    return this.configService.get<string>(
      'DM_SERVICE_URL',
      'http://localhost:3007',
    );
  }

  get fileServiceUrl(): string {
    return this.configService.get<string>(
      'FILE_SERVICE_URL',
      'http://localhost:3008',
    );
  }

  get roleServiceUrl(): string {
    return this.configService.get<string>(
      'ROLE_SERVICE_URL',
      'http://localhost:3009',
    );
  }

  get voiceServiceUrl(): string {
    return this.configService.get<string>(
      'VOICE_SERVICE_URL',
      'http://localhost:3010',
    );
  }

  get notificationServiceUrl(): string {
    return this.configService.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://localhost:3011',
    );
  }

  get securityServiceUrl(): string {
    return this.configService.get<string>(
      'SECURITY_SERVICE_URL',
      'http://localhost:3012',
    );
  }

  get analyticsServiceUrl(): string {
    return this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://localhost:3013',
    );
  }

  get gatewayPort(): number {
    return this.configService.get<number>('PORT', 3000);
  }
}
