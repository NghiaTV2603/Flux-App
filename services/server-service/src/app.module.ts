import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ServerModule } from "./server/server.module";
import { PrismaService } from "./prisma/prisma.service";
import { RabbitMQService } from "./rabbitmq/rabbitmq.service";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ServerModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RabbitMQService],
})
export class AppModule {}
