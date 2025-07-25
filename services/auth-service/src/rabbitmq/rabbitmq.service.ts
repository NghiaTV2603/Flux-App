import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel; // Use any to avoid TypeScript issues
  private channel: amqp.Channel;
  private readonly exchange = 'app.events';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
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

  async publishEvent(routingKey: string, data: any) {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      const message = Buffer.from(JSON.stringify(data));

      await this.channel.publish(this.exchange, routingKey, message, {
        persistent: true,
        timestamp: Date.now(),
      });

      this.logger.log(`Published event: ${routingKey}`, data);
    } catch (error) {
      this.logger.error(`Failed to publish event ${routingKey}:`, error);
      throw error;
    }
  }

  // Specific method for user events
  async publishUserCreated(userData: {
    userId: string;
    username: string;
    email: string;
  }) {
    await this.publishEvent('user.created', userData);
  }

  async publishUserUpdated(userData: {
    userId: string;
    username?: string;
    email?: string;
  }) {
    await this.publishEvent('user.updated', userData);
  }
}
