import { Module } from "@nestjs/common";
import { ServerController } from "./server.controller";
import { ServerService } from "./server.service";
import { PrismaService } from "../prisma/prisma.service";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";
import { UserClientService } from "../services/user-client.service";

@Module({
  controllers: [ServerController],
  providers: [ServerService, PrismaService, RabbitMQService, UserClientService],
  exports: [ServerService],
})
export class ServerModule {}
