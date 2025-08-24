import {
  WebSocketGateway as WSGatewayDecorator,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { WebSocketService } from './websocket.service';

// Simple auth guard for WebSocket (you can enhance this)
class WsAuthGuard {
  canActivate(context: any): boolean {
    const client = context.switchToWs().getClient();
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;

    // TODO: Implement proper JWT validation
    // For now, just check if token exists
    return !!token;
  }
}

@WSGatewayDecorator({
  namespace: '/realtime',
  cors: {
    origin: '*', // Configure properly in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly websocketService: WebSocketService,
  ) {}

  // ============= LIFECYCLE HOOKS =============

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const userId = this.extractUserId(client);
      const userAgent = client.handshake.headers['user-agent'];
      const ipAddress = client.handshake.address;

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Register connection
      await this.websocketService.handleUserConnect(userId, client.id, {
        userAgent,
        ipAddress,
        platform: this.detectPlatform(userAgent),
      });

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to Flux Realtime Service',
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = this.extractUserId(client);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);

      // Handle disconnection
      await this.websocketService.handleUserDisconnect(userId, client.id);
    } catch (error) {
      this.logger.error('Disconnection error:', error);
    }
  }

  // ============= MESSAGE EVENTS =============

  @SubscribeMessage('join_channel')
  @UseGuards(WsAuthGuard)
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; serverId: string },
  ) {
    try {
      const userId = this.extractUserId(client);
      const { channelId, serverId } = data;

      this.logger.log(`User ${userId} joining channel ${channelId}`);

      // Join channel room
      await this.websocketService.joinChannel(
        userId,
        client.id,
        channelId,
        serverId,
      );

      // Notify channel members
      client.to(`channel:${channelId}`).emit('user_joined_channel', {
        userId,
        channelId,
        timestamp: new Date().toISOString(),
      });

      // Confirm to client
      client.emit('channel_joined', {
        channelId,
        serverId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Join channel error:', error);
      client.emit('error', { message: 'Failed to join channel' });
    }
  }

  @SubscribeMessage('leave_channel')
  @UseGuards(WsAuthGuard)
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    try {
      const userId = this.extractUserId(client);
      const { channelId } = data;

      this.logger.log(`User ${userId} leaving channel ${channelId}`);

      // Leave channel room
      await this.websocketService.leaveChannel(userId, client.id, channelId);

      // Notify channel members
      client.to(`channel:${channelId}`).emit('user_left_channel', {
        userId,
        channelId,
        timestamp: new Date().toISOString(),
      });

      // Confirm to client
      client.emit('channel_left', {
        channelId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Leave channel error:', error);
      client.emit('error', { message: 'Failed to leave channel' });
    }
  }

  // ============= TYPING INDICATORS =============

  @SubscribeMessage('typing_start')
  @UseGuards(WsAuthGuard)
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    try {
      const userId = this.extractUserId(client);
      const { channelId } = data;

      await this.websocketService.startTyping(userId, channelId);

      // Broadcast to channel members (except sender)
      client.to(`channel:${channelId}`).emit('typing_start', {
        userId,
        channelId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Typing start error:', error);
    }
  }

  @SubscribeMessage('typing_stop')
  @UseGuards(WsAuthGuard)
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    try {
      const userId = this.extractUserId(client);
      const { channelId } = data;

      await this.websocketService.stopTyping(userId, channelId);

      // Broadcast to channel members (except sender)
      client.to(`channel:${channelId}`).emit('typing_stop', {
        userId,
        channelId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Typing stop error:', error);
    }
  }

  // ============= PRESENCE EVENTS =============

  @SubscribeMessage('update_presence')
  @UseGuards(WsAuthGuard)
  async handleUpdatePresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: string; customStatus?: string },
  ) {
    try {
      const userId = this.extractUserId(client);
      const { status, customStatus } = data;

      await this.websocketService.updateUserPresence(
        userId,
        status,
        customStatus,
      );

      // Broadcast presence update to friends/servers
      // TODO: Get user's friends and servers to broadcast to
      this.server.emit('presence_update', {
        userId,
        status,
        customStatus,
        timestamp: new Date().toISOString(),
      });

      client.emit('presence_updated', {
        status,
        customStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Update presence error:', error);
      client.emit('error', { message: 'Failed to update presence' });
    }
  }

  // ============= DIRECT MESSAGE EVENTS =============

  @SubscribeMessage('join_dm')
  @UseGuards(WsAuthGuard)
  async handleJoinDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { otherUserId: string },
  ) {
    try {
      const userId = this.extractUserId(client);
      const { otherUserId } = data;

      const roomId = await this.websocketService.joinDMRoom(
        userId,
        otherUserId,
        client.id,
      );

      client.emit('dm_joined', {
        roomId,
        otherUserId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Join DM error:', error);
      client.emit('error', { message: 'Failed to join DM' });
    }
  }

  // ============= UTILITY METHODS =============

  private extractUserId(client: Socket): string {
    // Extract user ID from JWT token or handshake
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;

    // TODO: Implement proper JWT decoding
    // For now, get from handshake query
    const userId = client.handshake.query?.userId as string;

    if (!userId) {
      throw new Error('User ID not found in handshake');
    }

    return userId;
  }

  private detectPlatform(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Electron')) return 'desktop';
    return 'web';
  }

  // ============= PUBLIC METHODS FOR EXTERNAL USE =============

  async broadcastToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  async broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  async broadcastToDM(roomId: string, event: string, data: any) {
    this.server.to(`dm:${roomId}`).emit(event, data);
  }
}
