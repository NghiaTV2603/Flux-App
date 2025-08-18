import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, RabbitMQService],
  exports: [UserService],
})
export class UserModule {}
