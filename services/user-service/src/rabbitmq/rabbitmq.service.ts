import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { UserService } from '../user/user.service';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel; // Use any to avoid TypeScript issues
  private channel: amqp.Channel;
  private readonly exchange = 'app.events';
  private readonly queueName = 'user.service.queue';

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

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

      // Declare queue
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });

      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
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

  private async setupConsumers() {
    try {
      // Bind queue to exchange for user events
      await this.channel.bindQueue(this.queueName, this.exchange, 'user.*');

      // Start consuming
      await this.channel.consume(this.queueName, async (message: any) => {
        if (message) {
          try {
            const routingKey = message.fields.routingKey;
            const data = JSON.parse(message.content.toString());

            this.logger.log(`Received event: ${routingKey}`, data);

            // Handle different event types
            switch (routingKey) {
              case 'user.created':
                await this.handleUserCreated(data);
                break;
              case 'user.updated':
                await this.handleUserUpdated(data);
                break;
              default:
                this.logger.warn(`Unhandled event type: ${routingKey}`);
            }

            // Acknowledge the message
            this.channel.ack(message);
          } catch (error) {
            this.logger.error('Error processing message:', error);

            // Reject and don't requeue to prevent infinite loops
            this.channel.nack(message, false, false);
          }
        }
      });

      this.logger.log('Event consumers setup complete');
    } catch (error) {
      this.logger.error('Failed to setup consumers:', error);
      throw error;
    }
  }

  private async handleUserCreated(data: {
    userId: string;
    username: string;
    email: string;
  }) {
    try {
      this.logger.log('Processing user.created event', data);

      // Check if profile already exists
      const exists = await this.userService.profileExists(data.userId);
      if (!exists) {
        await this.userService.createProfile({
          userId: data.userId,
          username: data.username,
        });
        this.logger.log(`Created user profile for user: ${data.userId}`);
      } else {
        this.logger.warn(
          `User profile already exists for user: ${data.userId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling user.created event:', error);
      throw error;
    }
  }

  private async handleUserUpdated(data: {
    userId: string;
    username?: string;
    email?: string;
  }) {
    try {
      this.logger.log('Processing user.updated event', data);

      if (data.username) {
        await this.userService.syncUsername(data.userId, data.username);
        this.logger.log(`Updated username for user: ${data.userId}`);
      }
    } catch (error) {
      this.logger.error('Error handling user.updated event:', error);
      throw error;
    }
  }
}
