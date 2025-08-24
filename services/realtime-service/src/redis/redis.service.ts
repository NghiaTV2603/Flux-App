import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const redisUrl =
        this.configService.get<string>('redis.url') || 'redis://localhost:6379';
      this.client = new Redis(redisUrl);

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  // ============= CONNECTION MANAGEMENT =============

  async setUserConnection(
    userId: string,
    socketId: string,
    connectionData: any,
  ) {
    const key = `connection:${userId}`;
    const data = {
      socketId,
      connectedAt: new Date().toISOString(),
      ...connectionData,
    };

    await this.client.hset(key, data);
    await this.client.expire(key, 86400); // 24 hours TTL

    // Add to online users set
    await this.client.sadd('users:online', userId);
  }

  async getUserConnection(userId: string) {
    const key = `connection:${userId}`;
    return await this.client.hgetall(key);
  }

  async removeUserConnection(userId: string) {
    const key = `connection:${userId}`;
    await this.client.del(key);

    // Remove from online users set
    await this.client.srem('users:online', userId);
  }

  async getOnlineUsers(): Promise<string[]> {
    return await this.client.smembers('users:online');
  }

  // ============= CHANNEL SUBSCRIPTIONS =============

  async addUserToChannel(userId: string, channelId: string) {
    const channelKey = `channel:${channelId}:users`;
    const userKey = `user:${userId}:channels`;

    await this.client.sadd(channelKey, userId);
    await this.client.sadd(userKey, channelId);

    // Set TTL for cleanup
    await this.client.expire(channelKey, 86400);
    await this.client.expire(userKey, 86400);
  }

  async removeUserFromChannel(userId: string, channelId: string) {
    const channelKey = `channel:${channelId}:users`;
    const userKey = `user:${userId}:channels`;

    await this.client.srem(channelKey, userId);
    await this.client.srem(userKey, channelId);
  }

  async getChannelUsers(channelId: string): Promise<string[]> {
    const key = `channel:${channelId}:users`;
    return await this.client.smembers(key);
  }

  async getUserChannels(userId: string): Promise<string[]> {
    const key = `user:${userId}:channels`;
    return await this.client.smembers(key);
  }

  // ============= TYPING INDICATORS =============

  async setTypingIndicator(userId: string, channelId: string, ttl: number = 5) {
    const key = `typing:${channelId}`;
    await this.client.sadd(key, userId);
    await this.client.expire(key, ttl);
  }

  async removeTypingIndicator(userId: string, channelId: string) {
    const key = `typing:${channelId}`;
    await this.client.srem(key, userId);
  }

  async getTypingUsers(channelId: string): Promise<string[]> {
    const key = `typing:${channelId}`;
    return await this.client.smembers(key);
  }

  // ============= PRESENCE MANAGEMENT =============

  async setUserPresence(userId: string, status: string, customStatus?: string) {
    const key = `presence:${userId}`;
    const data: any = {
      status,
      lastSeen: new Date().toISOString(),
    };

    if (customStatus) {
      data.customStatus = customStatus;
    }

    await this.client.hset(key, data);
    await this.client.expire(key, 86400);
  }

  async getUserPresence(userId: string) {
    const key = `presence:${userId}`;
    return await this.client.hgetall(key);
  }

  // ============= ROOM MANAGEMENT =============

  async addSocketToRoom(socketId: string, roomName: string) {
    const key = `room:${roomName}`;
    await this.client.sadd(key, socketId);
    await this.client.expire(key, 86400);
  }

  async removeSocketFromRoom(socketId: string, roomName: string) {
    const key = `room:${roomName}`;
    await this.client.srem(key, socketId);
  }

  async getRoomSockets(roomName: string): Promise<string[]> {
    const key = `room:${roomName}`;
    return await this.client.smembers(key);
  }

  async removeSocketFromAllRooms(socketId: string) {
    // This is expensive, better to track socket rooms separately
    const pattern = 'room:*';
    const keys = await this.client.keys(pattern);

    for (const key of keys) {
      await this.client.srem(key, socketId);
    }
  }

  // ============= MESSAGE CACHE =============

  async cacheMessage(messageId: string, messageData: any, ttl: number = 3600) {
    const key = `message:${messageId}`;
    await this.client.setex(key, ttl, JSON.stringify(messageData));
  }

  async getCachedMessage(messageId: string) {
    const key = `message:${messageId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ============= RATE LIMITING =============

  async checkRateLimit(
    userId: string,
    action: string,
    limit: number = 10,
    window: number = 60,
  ): Promise<boolean> {
    const key = `ratelimit:${userId}:${action}`;
    const current = await this.client.incr(key);

    if (current === 1) {
      await this.client.expire(key, window);
    }

    return current <= limit;
  }

  // ============= ANALYTICS =============

  async incrementEventCounter(
    eventType: string,
    date: string = new Date().toISOString().split('T')[0],
  ) {
    const key = `analytics:${date}:${eventType}`;
    await this.client.incr(key);
    await this.client.expire(key, 86400 * 7); // Keep for 7 days
  }

  async getEventCount(eventType: string, date: string): Promise<number> {
    const key = `analytics:${date}:${eventType}`;
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }
}
