import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: any;
  private channel: any;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    private configService: ConfigService,
    private websocketService: WebSocketService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupExchangesAndQueues();
    await this.setupEventConsumers();
  }

  private async connect() {
    try {
      const rabbitmqUrl =
        this.configService.get<string>('rabbitmq.url') ||
        'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async setupExchangesAndQueues() {
    // Setup exchanges
    await this.channel.assertExchange('app.events', 'topic', { durable: true });

    // Setup queues for realtime service
    await this.channel.assertQueue('realtime.queue', { durable: true });

    // Bind queues to exchange for message events
    await this.channel.bindQueue(
      'realtime.queue',
      'app.events',
      'message.*',
    );

    // Bind queues for user presence events
    await this.channel.bindQueue(
      'realtime.queue',
      'app.events',
      'user.presence.*',
    );

    // Bind queues for server events (user join/leave)
    await this.channel.bindQueue(
      'realtime.queue',
      'app.events',
      'server.member.*',
    );
  }

  private async setupEventConsumers() {
    // Consume realtime events
    await this.channel.consume(
      'realtime.queue',
      (msg) => {
        if (msg) {
          this.handleEvent(msg);
        }
      },
      { noAck: false },
    );

    this.logger.log('Event consumers setup complete');
  }

  private async handleEvent(msg: amqp.ConsumeMessage) {
    try {
      const routingKey = msg.fields.routingKey;
      const eventData = JSON.parse(msg.content.toString());

      this.logger.log(`Processing event: ${routingKey}`);

      switch (routingKey) {
        // ============= MESSAGE EVENTS =============
        case 'message.channel.sent':
          await this.handleChannelMessageSent(eventData);
          break;

        case 'message.channel.updated':
          await this.handleChannelMessageUpdated(eventData);
          break;

        case 'message.channel.deleted':
          await this.handleChannelMessageDeleted(eventData);
          break;

        case 'message.dm.sent':
          await this.handleDirectMessageSent(eventData);
          break;

        case 'message.dm.updated':
          await this.handleDirectMessageUpdated(eventData);
          break;

        case 'message.dm.deleted':
          await this.handleDirectMessageDeleted(eventData);
          break;

        // ============= REACTION EVENTS =============
        case 'message.reaction.added':
          await this.handleReactionAdded(eventData);
          break;

        case 'message.reaction.removed':
          await this.handleReactionRemoved(eventData);
          break;

        // ============= USER PRESENCE EVENTS =============
        case 'user.presence.updated':
          await this.handleUserPresenceUpdated(eventData);
          break;

        case 'user.status.changed':
          await this.handleUserStatusChanged(eventData);
          break;

        // ============= SERVER EVENTS =============
        case 'server.member.joined':
          await this.handleServerMemberJoined(eventData);
          break;

        case 'server.member.left':
          await this.handleServerMemberLeft(eventData);
          break;

        default:
          this.logger.warn(`Unhandled event: ${routingKey}`);
      }

      // Acknowledge the message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error handling event:', error);
      // Reject and requeue the message
      this.channel.nack(msg, false, true);
    }
  }

  // ============= MESSAGE EVENT HANDLERS =============

  private async handleChannelMessageSent(eventData: {
    messageId: string;
    channelId: string;
    serverId: string;
    authorId: string;
    content: string;
    mentions?: string[];
    attachments?: any[];
    createdAt?: string;
  }) {
    try {
      // Broadcast new message to channel subscribers
      await this.websocketService.broadcastMessageToChannel(
        eventData.channelId,
        {
          id: eventData.messageId,
          channelId: eventData.channelId,
          serverId: eventData.serverId,
          authorId: eventData.authorId,
          content: eventData.content,
          attachments: eventData.attachments,
          createdAt: eventData.createdAt || new Date().toISOString(),
        }
      );

      // Handle mentions if present
      if (eventData.mentions && eventData.mentions.length > 0) {
        for (const mentionedUserId of eventData.mentions) {
          await this.sendMentionNotification(
            mentionedUserId,
            eventData.authorId,
            eventData.channelId,
            eventData.messageId,
            'channel'
          );
        }
      }

      this.logger.log(`Broadcasted channel message ${eventData.messageId} to channel ${eventData.channelId}`);

    } catch (error) {
      this.logger.error('Error handling channel message sent:', error);
    }
  }

  private async handleChannelMessageUpdated(eventData: {
    messageId: string;
    channelId: string;
    serverId: string;
    authorId: string;
    content: string;
  }) {
    try {
      // Broadcast message update to channel subscribers
      await this.websocketService.broadcastMessageToChannel(
        eventData.channelId,
        {
          type: 'message:updated',
          id: eventData.messageId,
          channelId: eventData.channelId,
          content: eventData.content,
          isEdited: true,
          updatedAt: new Date().toISOString(),
        }
      );

    } catch (error) {
      this.logger.error('Error handling channel message updated:', error);
    }
  }

  private async handleChannelMessageDeleted(eventData: {
    messageId: string;
    channelId: string;
    serverId: string;
    authorId: string;
  }) {
    try {
      // Broadcast message deletion to channel subscribers
      await this.websocketService.broadcastMessageToChannel(
        eventData.channelId,
        {
          type: 'message:deleted',
          id: eventData.messageId,
          channelId: eventData.channelId,
          deletedAt: new Date().toISOString(),
        }
      );

    } catch (error) {
      this.logger.error('Error handling channel message deleted:', error);
    }
  }

  private async handleDirectMessageSent(eventData: {
    messageId: string;
    senderId: string;
    receiverId: string;
    content: string;
    attachments?: any[];
    createdAt?: string;
  }) {
    try {
      // Create DM room ID
      const user1Id = eventData.senderId < eventData.receiverId ? eventData.senderId : eventData.receiverId;
      const user2Id = eventData.senderId < eventData.receiverId ? eventData.receiverId : eventData.senderId;
      const roomId = `dm_${user1Id}_${user2Id}`;

      // Broadcast to DM room
      await this.websocketService.broadcastMessageToDM(roomId, {
        id: eventData.messageId,
        senderId: eventData.senderId,
        receiverId: eventData.receiverId,
        content: eventData.content,
        attachments: eventData.attachments,
        createdAt: eventData.createdAt || new Date().toISOString(),
      });

      // Send notification to receiver
      await this.sendDirectMessageNotification(
        eventData.receiverId,
        eventData.senderId,
        eventData.messageId
      );

    } catch (error) {
      this.logger.error('Error handling direct message sent:', error);
    }
  }

  private async handleDirectMessageUpdated(eventData: {
    messageId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    try {
      const user1Id = eventData.senderId < eventData.receiverId ? eventData.senderId : eventData.receiverId;
      const user2Id = eventData.senderId < eventData.receiverId ? eventData.receiverId : eventData.senderId;
      const roomId = `dm_${user1Id}_${user2Id}`;

      await this.websocketService.broadcastMessageToDM(roomId, {
        type: 'dm:updated',
        id: eventData.messageId,
        content: eventData.content,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error handling direct message updated:', error);
    }
  }

  private async handleDirectMessageDeleted(eventData: {
    messageId: string;
    senderId: string;
    receiverId: string;
  }) {
    try {
      const user1Id = eventData.senderId < eventData.receiverId ? eventData.senderId : eventData.receiverId;
      const user2Id = eventData.senderId < eventData.receiverId ? eventData.receiverId : eventData.senderId;
      const roomId = `dm_${user1Id}_${user2Id}`;

      await this.websocketService.broadcastMessageToDM(roomId, {
        type: 'dm:deleted',
        id: eventData.messageId,
        deletedAt: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error handling direct message deleted:', error);
    }
  }

  // ============= REACTION EVENT HANDLERS =============

  private async handleReactionAdded(eventData: {
    messageId: string;
    channelId?: string;
    serverId?: string;
    userId: string;
    emoji: string;
    type: 'channel' | 'dm';
  }) {
    try {
      if (eventData.type === 'channel' && eventData.channelId) {
        await this.websocketService.broadcastReactionUpdate(
          eventData.channelId,
          {
            type: 'reaction:added',
            messageId: eventData.messageId,
            userId: eventData.userId,
            emoji: eventData.emoji,
          }
        );
      }
      // TODO: Handle DM reactions

    } catch (error) {
      this.logger.error('Error handling reaction added:', error);
    }
  }

  private async handleReactionRemoved(eventData: {
    messageId: string;
    channelId?: string;
    serverId?: string;
    userId: string;
    emoji: string;
    type: 'channel' | 'dm';
  }) {
    try {
      if (eventData.type === 'channel' && eventData.channelId) {
        await this.websocketService.broadcastReactionUpdate(
          eventData.channelId,
          {
            type: 'reaction:removed',
            messageId: eventData.messageId,
            userId: eventData.userId,
            emoji: eventData.emoji,
          }
        );
      }
      // TODO: Handle DM reactions

    } catch (error) {
      this.logger.error('Error handling reaction removed:', error);
    }
  }

  // ============= USER PRESENCE HANDLERS =============

  private async handleUserPresenceUpdated(eventData: {
    userId: string;
    status: string;
    customStatus?: string;
  }) {
    try {
      // Update user presence in realtime service
      await this.websocketService.updateUserPresence(
        eventData.userId,
        eventData.status,
        eventData.customStatus
      );

      // TODO: Broadcast to user's friends and servers

    } catch (error) {
      this.logger.error('Error handling user presence updated:', error);
    }
  }

  private async handleUserStatusChanged(eventData: {
    userId: string;
    status: string;
  }) {
    try {
      // Similar to presence update
      await this.websocketService.updateUserPresence(eventData.userId, eventData.status);

    } catch (error) {
      this.logger.error('Error handling user status changed:', error);
    }
  }

  // ============= SERVER EVENT HANDLERS =============

  private async handleServerMemberJoined(eventData: {
    serverId: string;
    userId: string;
    memberInfo: any;
  }) {
    try {
      // TODO: Broadcast to server members about new member
      this.logger.log(`User ${eventData.userId} joined server ${eventData.serverId}`);

    } catch (error) {
      this.logger.error('Error handling server member joined:', error);
    }
  }

  private async handleServerMemberLeft(eventData: {
    serverId: string;
    userId: string;
  }) {
    try {
      // TODO: Broadcast to server members about member leaving
      this.logger.log(`User ${eventData.userId} left server ${eventData.serverId}`);

    } catch (error) {
      this.logger.error('Error handling server member left:', error);
    }
  }

  // ============= NOTIFICATION HELPERS =============

  private async sendMentionNotification(
    mentionedUserId: string,
    authorId: string,
    channelId: string,
    messageId: string,
    type: 'channel' | 'dm'
  ) {
    try {
      // Send real-time notification to mentioned user
      const notificationData = {
        type: 'mention',
        authorId,
        channelId,
        messageId,
        content: `You were mentioned in ${type === 'channel' ? `#${channelId}` : 'a direct message'}`,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to user's personal room
      // TODO: Implement user room broadcasting

    } catch (error) {
      this.logger.error('Error sending mention notification:', error);
    }
  }

  private async sendDirectMessageNotification(
    receiverId: string,
    senderId: string,
    messageId: string
  ) {
    try {
      // Send real-time notification for new DM
      const notificationData = {
        type: 'direct_message',
        senderId,
        messageId,
        content: `New message from ${senderId}`,
        timestamp: new Date().toISOString(),
      };

      // TODO: Implement user notification broadcasting

    } catch (error) {
      this.logger.error('Error sending direct message notification:', error);
    }
  }
}
