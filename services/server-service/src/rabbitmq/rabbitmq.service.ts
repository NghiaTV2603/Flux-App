import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;
  private readonly exchange = "app.events";

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>("rabbitmq.url");
      this.connection = await amqp.connect(
        rabbitmqUrl || "amqp://localhost:5672"
      );
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });
      this.logger.log("Connected to RabbitMQ");
    } catch (error) {
      this.logger.error("Failed to connect to RabbitMQ:", error);
      // Don't throw error in init to allow service to start without RabbitMQ
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
      this.logger.log("Disconnected from RabbitMQ");
    } catch (error) {
      this.logger.error("Error disconnecting from RabbitMQ:", error);
    }
  }

  async publishEvent(routingKey: string, data: any) {
    try {
      if (!this.channel) {
        this.logger.warn(
          "RabbitMQ channel not available, skipping event publish"
        );
        return;
      }

      const message = Buffer.from(JSON.stringify(data));

      await this.channel.publish(this.exchange, routingKey, message, {
        persistent: true,
        timestamp: Date.now(),
      });

      this.logger.log(`Published event: ${routingKey}`, data);
    } catch (error) {
      this.logger.error(`Failed to publish event ${routingKey}:`, error);
      // Don't throw error to avoid breaking the service
    }
  }

  // Server-specific event methods
  async publishServerCreated(serverData: {
    serverId: string;
    serverName: string;
    ownerId: string;
    inviteCode: string;
  }) {
    await this.publishEvent("server.created", serverData);
  }

  async publishServerUpdated(serverData: {
    serverId: string;
    serverName: string;
    updatedBy: string;
  }) {
    await this.publishEvent("server.updated", serverData);
  }

  async publishServerDeleted(serverData: {
    serverId: string;
    serverName: string;
    ownerId: string;
  }) {
    await this.publishEvent("server.deleted", serverData);
  }

  async publishMemberJoined(memberData: {
    serverId: string;
    serverName: string;
    userId: string;
    memberId: string;
  }) {
    await this.publishEvent("server.member.joined", memberData);
  }

  async publishMemberLeft(memberData: {
    serverId: string;
    memberId: string;
    userId: string;
    removedBy: string;
  }) {
    await this.publishEvent("server.member.left", memberData);
  }

  async publishMemberUpdated(memberData: {
    serverId: string;
    memberId: string;
    userId: string;
    updatedBy: string;
    changes: any;
  }) {
    await this.publishEvent("server.member.updated", memberData);
  }
}
