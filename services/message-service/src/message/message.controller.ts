import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { AddReactionDto } from '../dto/add-reaction.dto';
import { UserInfo } from '../types/user.types';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // Channel Messages
  @Post('channels/:channelId/messages')
  async createChannelMessage(
    @Param('channelId') channelId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: { user: UserInfo },
  ) {
    createMessageDto.messageType = 'channel';
    createMessageDto.channelId = channelId;

    return this.messageService.createMessage(
      createMessageDto,
      req.user.id,
      req.user,
    );
  }

  @Get('channels/:channelId/messages')
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @Query() queryDto: QueryMessagesDto,
  ) {
    return this.messageService.getMessages(channelId, 'channelId', queryDto);
  }

  // Direct Messages
  @Post('conversations/:conversationId/messages')
  async createDirectMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: { user: UserInfo },
  ) {
    createMessageDto.messageType = 'direct';
    createMessageDto.conversationId = conversationId;

    return this.messageService.createMessage(
      createMessageDto,
      req.user.id,
      req.user,
    );
  }

  @Get('conversations/:conversationId/messages')
  async getDirectMessages(
    @Param('conversationId') conversationId: string,
    @Query() queryDto: QueryMessagesDto,
  ) {
    return this.messageService.getMessages(
      conversationId,
      'conversationId',
      queryDto,
    );
  }

  // Message Operations
  // @Get('messages/:messageId')
  // async getMessage(@Param('messageId') messageId: string) {
  //   // Implementation to get single message
  //   // This would be implemented in the service
  // }

  @Put('messages/:messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: { user: UserInfo },
  ) {
    return this.messageService.updateMessage(
      messageId,
      updateMessageDto,
      req.user.id,
    );
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Request() req: { user: UserInfo },
  ) {
    return this.messageService.deleteMessage(messageId, req.user.id);
  }

  // Message Reactions
  @Post('messages/:messageId/reactions')
  @HttpCode(HttpStatus.CREATED)
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() addReactionDto: AddReactionDto,
    @Request() req: { user: UserInfo },
  ) {
    return this.messageService.addReaction(
      messageId,
      addReactionDto,
      req.user.id,
    );
  }

  @Delete('messages/:messageId/reactions/:emoji')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Request() req: { user: UserInfo },
  ) {
    return this.messageService.removeReaction(messageId, emoji, req.user.id);
  }

  // Message Actions
  // @Post('messages/:messageId/pin')
  // @HttpCode(HttpStatus.OK)
  // async pinMessage(
  //   @Param('messageId') messageId: string,
  //   @Request() req: { user: UserInfo },
  // ) {
  //   // Implementation for pinning messages
  //   // This would require permission checks
  // }

  // @Delete('messages/:messageId/pin')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async unpinMessage(
  //   @Param('messageId') messageId: string,
  //   @Request() req: { user: UserInfo },
  // ) {
  //   // Implementation for unpinning messages
  // }

  // Search Messages
  @Get('channels/:channelId/search')
  async searchChannelMessages(
    @Param('channelId') channelId: string,
    @Query() queryDto: QueryMessagesDto,
  ) {
    queryDto.search = queryDto.search || '';
    return this.messageService.getMessages(channelId, 'channelId', queryDto);
  }

  @Get('conversations/:conversationId/search')
  async searchDirectMessages(
    @Param('conversationId') conversationId: string,
    @Query() queryDto: QueryMessagesDto,
  ) {
    queryDto.search = queryDto.search || '';
    return this.messageService.getMessages(
      conversationId,
      'conversationId',
      queryDto,
    );
  }
}
