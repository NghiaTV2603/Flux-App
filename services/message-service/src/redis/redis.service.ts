import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host') || 'localhost',
      port: this.configService.get<number>('redis.port') || 6379,
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  // Cache management methods
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // Message cache methods
  async cacheRecentMessages(
    locationKey: string,
    messages: any[],
  ): Promise<void> {
    const cacheKey = `messages:recent:${locationKey}`;
    const ttl = this.configService.get<number>('cache.ttl');
    await this.set(cacheKey, messages, ttl);
  }

  async getRecentMessages(locationKey: string): Promise<any[] | null> {
    const cacheKey = `messages:recent:${locationKey}`;
    return await this.get<any[]>(cacheKey);
  }

  // Typing indicators
  async setTypingIndicator(
    locationKey: string,
    userId: string,
    userData: any,
  ): Promise<void> {
    const key = `typing:${locationKey}:${userId}`;
    await this.set(key, userData, 10); // 10 seconds TTL
  }

  async removeTypingIndicator(
    locationKey: string,
    userId: string,
  ): Promise<void> {
    const key = `typing:${locationKey}:${userId}`;
    await this.del(key);
  }

  async getTypingUsers(locationKey: string): Promise<any[]> {
    const pattern = `typing:${locationKey}:*`;
    const keys = await this.client.keys(pattern);
    const users: any[] = [];

    for (const key of keys) {
      const userData = await this.get(key);
      if (userData) {
        users.push(userData);
      }
    }

    return users;
  }

  // Presence tracking
  async setUserPresence(
    channelId: string,
    userId: string,
    presence: any,
  ): Promise<void> {
    const key = `presence:${channelId}:${userId}`;
    await this.set(key, presence, 300); // 5 minutes TTL
  }

  async removeUserPresence(channelId: string, userId: string): Promise<void> {
    const key = `presence:${channelId}:${userId}`;
    await this.del(key);
  }

  async getChannelPresence(channelId: string): Promise<any[]> {
    const pattern = `presence:${channelId}:*`;
    const keys = await this.client.keys(pattern);
    const presenceList: any[] = [];

    for (const key of keys) {
      const presence = await this.get(key);
      if (presence) {
        presenceList.push(presence);
      }
    }

    return presenceList;
  }
}
