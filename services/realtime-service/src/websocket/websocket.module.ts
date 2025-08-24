import { Module } from '@nestjs/common';
import { WebSocketGateway as WSGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Module({
  providers: [
    WSGateway,
    WebSocketService,
    PrismaService,
    RedisService,
    RabbitMQService,
  ],
  exports: [WebSocketService],
})
export class WebSocketModule {}
