import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import {
  MessageEventData,
  MessageEditedEventData,
  MessageDeletedEventData,
  ReactionEventData,
  ThreadEventData,
  NotificationEventData,
  UserProfileUpdateEvent,
  ChannelDeletedEvent,
  BaseEventMessage,
  ParsedEventMessage,
} from '../types/rabbitmq.types';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;
  private readonly exchange = 'flux.events';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
    await this.setupConsumers();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
      this.connection = await amqp.connect(
        rabbitmqUrl || 'amqp://localhost:5672',
      );
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      // Declare queues for message service
      await this.channel.assertQueue('message.queue', { durable: true });
      await this.channel.assertQueue('notification.queue', { durable: true });

      // Bind queues to exchange with routing keys
      await this.channel.bindQueue('message.queue', this.exchange, 'message.#');
      await this.channel.bindQueue(
        'notification.queue',
        this.exchange,
        'notification.#',
      );

      this.logger.log('Connected to RabbitMQ and queues configured');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      // Don't throw error to allow service to start without RabbitMQ
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  publishEvent<T>(routingKey: string, data: T): void {
    try {
      if (!this.channel) {
        this.logger.warn(
          'RabbitMQ channel not available, skipping event publish',
        );
        return;
      }

      const message: T & BaseEventMessage = {
        ...data,
        timestamp: new Date().toISOString(),
        version: 'v1.0',
      };

      this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          timestamp: Date.now(),
        },
      );

      this.logger.log(`Published event: ${routingKey}`, message);
    } catch (error) {
      this.logger.error(`Failed to publish event ${routingKey}:`, error);
      // Don't throw error to avoid breaking the service
    }
  }

  // Message Events
  publishMessageSent(messageData: MessageEventData): void {
    const routingKey =
      messageData.messageType === 'direct'
        ? 'message.direct.sent'
        : 'message.channel.sent';

    this.publishEvent<MessageEventData>(routingKey, messageData);
  }

  publishMessageEdited(messageData: MessageEditedEventData): void {
    this.publishEvent<MessageEditedEventData>('message.edited', messageData);
  }

  publishMessageDeleted(messageData: MessageDeletedEventData): void {
    this.publishEvent<MessageDeletedEventData>('message.deleted', messageData);
  }

  publishReactionAdded(reactionData: ReactionEventData): void {
    this.publishEvent<ReactionEventData>(
      'message.reaction.added',
      reactionData,
    );
  }

  publishReactionRemoved(reactionData: ReactionEventData): void {
    this.publishEvent<ReactionEventData>(
      'message.reaction.removed',
      reactionData,
    );
  }

  // Thread Events
  publishThreadCreated(threadData: ThreadEventData): void {
    this.publishEvent<ThreadEventData>('thread.created', threadData);
  }

  // Notification Events
  publishNotificationCreated(notificationData: NotificationEventData): void {
    this.publishEvent<NotificationEventData>(
      'notification.created',
      notificationData,
    );
  }

  // Consumer setup for handling events from other services
  async setupConsumers(): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.warn(
          'RabbitMQ channel not available, skipping consumers setup',
        );
        return;
      }

      await this.channel.bindQueue('message.queue', this.exchange, 'user.*');
      await this.channel.bindQueue('message.queue', this.exchange, 'server.*');

      await this.channel.consume('message.queue', (msg) => {
        if (msg) {
          try {
            const rawContent = msg.content.toString();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const event = this.parseEventMessage(rawContent);
            const routingKey = msg.fields.routingKey;

            this.logger.log(`Received event: ${routingKey}`, event);

            // Handle different event types
            switch (routingKey) {
              case 'user.profile.updated':
                this.handleUserProfileUpdate(
                  event as unknown as UserProfileUpdateEvent,
                );
                break;
              case 'server.member.joined':
                this.logger.log('User joined server:', event);
                break;
              case 'server.channel.deleted':
                this.handleChannelDeleted(
                  event as unknown as ChannelDeletedEvent,
                );
                break;
              default:
                this.logger.warn(`Unhandled event type: ${routingKey}`);
            }

            this.channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message:', error);
            this.channel.nack(msg, false, false); // Dead letter
          }
        }
      });

      this.logger.log('Event consumers setup complete');
    } catch (error) {
      this.logger.error('Failed to setup consumers:', error);
    }
  }

  private handleUserProfileUpdate(event: UserProfileUpdateEvent): void {
    // This would update denormalized user data in messages
    // Implementation would depend on the specific MongoDB operations
    this.logger.log('Handling user profile update:', event);
    // TODO: Update denormalized user data in messages collection
  }

  private handleChannelDeleted(event: ChannelDeletedEvent): void {
    // Soft delete all messages in the channel
    this.logger.log('Handling channel deletion:', event);
    // TODO: Soft delete all messages in the channel
  }

  private parseEventMessage(content: string): ParsedEventMessage {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = JSON.parse(content);
      return parsed as ParsedEventMessage;
    } catch (error) {
      this.logger.error('Failed to parse event message:', error);
      return {};
    }
  }
}
