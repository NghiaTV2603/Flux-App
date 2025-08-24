import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configuration
import configuration from './config/configuration';

// Modules
import { DatabaseModule } from './database/database.module';
import { MessageModule } from './message/message.module';

// Services
import { RedisService } from './redis/redis.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService, RabbitMQService],
})
export class AppModule {}
