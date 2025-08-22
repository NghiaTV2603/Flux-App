import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('redis.host') || 'localhost',
      port: this.configService.get('redis.port') || 6379,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      console.log('Redis connected in Auth Service');
    });

    this.client.on('error', (err) => {
      console.error('Redis error in Auth Service:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Session management helpers
  async setUserSession(
    userId: string,
    sessionData: any,
    ttlSeconds: number,
  ): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.set(sessionKey, JSON.stringify(sessionData), ttlSeconds);
  }

  async getUserSession(userId: string): Promise<any | null> {
    const sessionKey = `session:${userId}`;
    const sessionData = await this.get(sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.del(sessionKey);
  }

  // Token blacklist helpers
  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    const blacklistKey = `blacklist:${token}`;
    await this.set(blacklistKey, '1', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `blacklist:${token}`;
    return await this.exists(blacklistKey);
  }
}
