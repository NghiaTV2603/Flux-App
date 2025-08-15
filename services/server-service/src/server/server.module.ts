import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Module({
  controllers: [ServerController],
  providers: [ServerService, PrismaService, RabbitMQService],
  exports: [ServerService],
})
export class ServerModule {}
