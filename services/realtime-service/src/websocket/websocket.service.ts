import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WebSocketService {
  private server: Server;
  private readonly logger = new Logger(WebSocketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  // ============= CONNECTION MANAGEMENT =============

  async handleUserConnect(
    userId: string,
    socketId: string,
    connectionData: {
      userAgent?: string;
      ipAddress?: string;
      platform?: string;
    }
  ) {
    try {
      // Store connection in database
      await this.prisma.userConnection.create({
        data: {
          userId,
          socketId,
          userAgent: connectionData.userAgent,
          ipAddress: connectionData.ipAddress,
          platform: connectionData.platform,
          status: 'online',
        },
      });

      // Store in Redis for fast access
      await this.redis.setUserConnection(userId, socketId, connectionData);

      // Update user presence
      await this.updateUserPresence(userId, 'online');

      // Join user to their personal room
      await this.joinUserRoom(userId, socketId);

      this.logger.log(`User ${userId} connected with socket ${socketId}`);

    } catch (error) {
      this.logger.error('Error handling user connect:', error);
      throw error;
    }
  }

  async handleUserDisconnect(userId: string, socketId: string) {
    try {
      // Update connection in database
      await this.prisma.userConnection.updateMany({
        where: { userId, socketId },
        data: {
          status: 'offline',
          disconnectedAt: new Date(),
        },
      });

      // Remove from Redis
      await this.redis.removeUserConnection(userId);

      // Check if user has other active connections
      const activeConnections = await this.prisma.userConnection.count({
        where: {
          userId,
          status: 'online',
          disconnectedAt: null,
        },
      });

      // Update presence if no active connections
      if (activeConnections === 0) {
        await this.updateUserPresence(userId, 'offline');
      }

      // Clean up channel subscriptions for this socket
      await this.cleanupSocketSubscriptions(socketId);

      this.logger.log(`User ${userId} disconnected from socket ${socketId}`);

    } catch (error) {
      this.logger.error('Error handling user disconnect:', error);
    }
  }

  // ============= CHANNEL MANAGEMENT =============

  async joinChannel(userId: string, socketId: string, channelId: string, serverId: string) {
    try {
      // Check if user has permission to join channel (TODO: implement permission check)
      
      // Join Socket.IO room
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`channel:${channelId}`);
      }

      // Store subscription in database
      const connection = await this.prisma.userConnection.findFirst({
        where: { userId, socketId },
      });

      if (connection) {
        await this.prisma.channelSubscription.upsert({
          where: {
            connectionId_channelId: {
              connectionId: connection.id,
              channelId,
            },
          },
          update: {
            joinedAt: new Date(),
          },
          create: {
            connectionId: connection.id,
            channelId,
            serverId,
            userId,
          },
        });
      }

      // Store in Redis for fast access
      await this.redis.addUserToChannel(userId, channelId);
      await this.redis.addSocketToRoom(socketId, `channel:${channelId}`);

      this.logger.log(`User ${userId} joined channel ${channelId}`);

    } catch (error) {
      this.logger.error('Error joining channel:', error);
      throw error;
    }
  }

  async leaveChannel(userId: string, socketId: string, channelId: string) {
    try {
      // Leave Socket.IO room
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`channel:${channelId}`);
      }

      // Remove subscription from database
      const connection = await this.prisma.userConnection.findFirst({
        where: { userId, socketId },
      });

      if (connection) {
        await this.prisma.channelSubscription.deleteMany({
          where: {
            connectionId: connection.id,
            channelId,
          },
        });
      }

      // Remove from Redis
      await this.redis.removeUserFromChannel(userId, channelId);
      await this.redis.removeSocketFromRoom(socketId, `channel:${channelId}`);

      this.logger.log(`User ${userId} left channel ${channelId}`);

    } catch (error) {
      this.logger.error('Error leaving channel:', error);
      throw error;
    }
  }

  async getChannelMembers(channelId: string): Promise<string[]> {
    return await this.redis.getChannelUsers(channelId);
  }

  // ============= TYPING INDICATORS =============

  async startTyping(userId: string, channelId: string) {
    try {
      // Store in database with expiration
      await this.prisma.typingIndicator.upsert({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
        update: {
          isTyping: true,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 5000), // 5 seconds
        },
        create: {
          userId,
          channelId,
          isTyping: true,
          expiresAt: new Date(Date.now() + 5000),
        },
      });

      // Store in Redis with TTL
      await this.redis.setTypingIndicator(userId, channelId, 5);

    } catch (error) {
      this.logger.error('Error starting typing:', error);
    }
  }

  async stopTyping(userId: string, channelId: string) {
    try {
      // Remove from database
      await this.prisma.typingIndicator.deleteMany({
        where: { userId, channelId },
      });

      // Remove from Redis
      await this.redis.removeTypingIndicator(userId, channelId);

    } catch (error) {
      this.logger.error('Error stopping typing:', error);
    }
  }

  async getTypingUsers(channelId: string): Promise<string[]> {
    return await this.redis.getTypingUsers(channelId);
  }

  // ============= PRESENCE MANAGEMENT =============

  async updateUserPresence(userId: string, status: string, customStatus?: string) {
    try {
      // Update in database
      await this.prisma.userPresence.upsert({
        where: { userId },
        update: {
          status: status as any,
          customStatus,
          lastSeen: new Date(),
          isOnline: status === 'online',
        },
        create: {
          userId,
          status: status as any,
          customStatus,
          isOnline: status === 'online',
        },
      });

      // Update in Redis
      await this.redis.setUserPresence(userId, status, customStatus);

    } catch (error) {
      this.logger.error('Error updating user presence:', error);
    }
  }

  async getUserPresence(userId: string) {
    // Try Redis first
    const redisPresence = await this.redis.getUserPresence(userId);
    if (redisPresence && Object.keys(redisPresence).length > 0) {
      return redisPresence;
    }

    // Fallback to database
    return await this.prisma.userPresence.findUnique({
      where: { userId },
    });
  }

  // ============= DIRECT MESSAGE ROOMS =============

  async joinDMRoom(userId: string, otherUserId: string, socketId: string): Promise<string> {
    try {
      // Ensure consistent ordering for room creation
      const user1Id = userId < otherUserId ? userId : otherUserId;
      const user2Id = userId < otherUserId ? otherUserId : userId;

      // Create or get DM room
      const dmRoom = await this.prisma.dMRoom.upsert({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id,
          },
        },
        update: {
          lastActivity: new Date(),
          isActive: true,
        },
        create: {
          user1Id,
          user2Id,
          roomId: `dm_${user1Id}_${user2Id}`,
          isActive: true,
        },
      });

      // Join Socket.IO room
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`dm:${dmRoom.roomId}`);
      }

      return dmRoom.roomId;

    } catch (error) {
      this.logger.error('Error joining DM room:', error);
      throw error;
    }
  }

  // ============= MESSAGE BROADCASTING =============

  async broadcastMessageToChannel(channelId: string, messageData: any) {
    try {
      // Log event for analytics
      await this.logRealtimeEvent('message:new', {
        channelId,
        messageId: messageData.id,
        authorId: messageData.authorId,
      });

      // Broadcast to all channel members
      this.server.to(`channel:${channelId}`).emit('message:new', {
        ...messageData,
        timestamp: new Date().toISOString(),
      });

      // Increment analytics counter
      await this.redis.incrementEventCounter('messages_delivered');

    } catch (error) {
      this.logger.error('Error broadcasting message to channel:', error);
    }
  }

  async broadcastMessageToDM(roomId: string, messageData: any) {
    try {
      // Log event for analytics
      await this.logRealtimeEvent('dm:new', {
        roomId,
        messageId: messageData.id,
        senderId: messageData.senderId,
      });

      // Broadcast to DM room
      this.server.to(`dm:${roomId}`).emit('dm:new', {
        ...messageData,
        timestamp: new Date().toISOString(),
      });

      // Increment analytics counter
      await this.redis.incrementEventCounter('dm_messages_delivered');

    } catch (error) {
      this.logger.error('Error broadcasting message to DM:', error);
    }
  }

  async broadcastReactionUpdate(channelId: string, reactionData: any) {
    try {
      this.server.to(`channel:${channelId}`).emit('reaction:update', {
        ...reactionData,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error broadcasting reaction update:', error);
    }
  }

  // ============= UTILITY METHODS =============

  private async joinUserRoom(userId: string, socketId: string) {
    const socket = this.server.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`user:${userId}`);
    }
  }

  private async cleanupSocketSubscriptions(socketId: string) {
    try {
      // Remove from Redis rooms
      await this.redis.removeSocketFromAllRooms(socketId);

      // Remove channel subscriptions from database
      const connection = await this.prisma.userConnection.findFirst({
        where: { socketId },
      });

      if (connection) {
        await this.prisma.channelSubscription.deleteMany({
          where: { connectionId: connection.id },
        });
      }

    } catch (error) {
      this.logger.error('Error cleaning up socket subscriptions:', error);
    }
  }

  private async logRealtimeEvent(eventType: string, data: any) {
    try {
      await this.prisma.realtimeEvent.create({
        data: {
          eventType,
          userId: data.authorId || data.senderId,
          channelId: data.channelId,
          serverId: data.serverId,
          payload: data,
          success: true,
        },
      });
    } catch (error) {
      this.logger.error('Error logging realtime event:', error);
    }
  }

  // ============= HEALTH CHECK =============

  async getConnectionStats() {
    const totalConnections = await this.prisma.userConnection.count({
      where: { status: 'online', disconnectedAt: null },
    });

    const onlineUsers = await this.redis.getOnlineUsers();

    return {
      totalConnections,
      uniqueOnlineUsers: onlineUsers.length,
      timestamp: new Date().toISOString(),
    };
  }
}
