import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  message?: string;
}

export const RATE_LIMIT_KEY = 'rate-limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, rateLimitOptions);

    const current = await this.redisService.incrementRateLimit(
      key,
      Math.ceil(rateLimitOptions.windowMs / 1000),
    );

    if (current > rateLimitOptions.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            rateLimitOptions.message ||
            'Too many requests, please try again later',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private generateKey(request: Request, options: RateLimitOptions): string {
    const ip = request.ip || request.connection.remoteAddress;
    const userId = (request as any)['user']?.sub || 'anonymous';
    const endpoint = request.route?.path || request.url;

    return `rate_limit:${endpoint}:${userId}:${ip}:${options.windowMs}`;
  }
}
