import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

// Schemas
import { Message, MessageSchema } from '../schemas/message.schema';
import {
  MessageReadState,
  MessageReadStateSchema,
} from '../schemas/message-read-state.schema';
import {
  MessageThread,
  MessageThreadSchema,
} from '../schemas/message-thread.schema';
import {
  TypingIndicator,
  TypingIndicatorSchema,
} from '../schemas/typing-indicator.schema';
import {
  ChannelPresence,
  ChannelPresenceSchema,
} from '../schemas/channel-presence.schema';

// Services
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: MessageReadState.name, schema: MessageReadStateSchema },
      { name: MessageThread.name, schema: MessageThreadSchema },
      { name: TypingIndicator.name, schema: TypingIndicatorSchema },
      { name: ChannelPresence.name, schema: ChannelPresenceSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService, RedisService, RabbitMQService],
  exports: [MessageService],
})
export class MessageModule {}
