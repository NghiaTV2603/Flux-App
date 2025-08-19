import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

/**
 * Message Controller - Handles all messaging (channel + DM)
 * Routes requests to Message Service
 * Includes: channel messages, direct messages, threads, reactions
 */
@Controller()
@UseGuards(AuthGuard, RateLimitGuard)
export class MessageController {
  constructor(private readonly httpClient: HttpClientService) {}

  // ============= CHANNEL MESSAGE ENDPOINTS =============

  @Post('channels/:channelId/messages')
  @RateLimit({ limit: 30, windowMs: 60 * 1000 }) // 30 messages per minute
  async sendChannelMessage(
    @Param('channelId') channelId: string,
    @Body() messageDto: any,
    @Request() req: any,
  ) {
    const messageData = {
      ...messageDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'message',
      `/channels/${channelId}/messages`,
      messageData,
      config,
    );
    return response.data;
  }

  @Get('channels/:channelId/messages')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'message',
      `/channels/${channelId}/messages?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('channels/:channelId/messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 edits per minute
  async editChannelMessage(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'message',
      `/channels/${channelId}/messages/${id}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('channels/:channelId/messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 deletes per minute
  async deleteChannelMessage(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'message',
      `/channels/${channelId}/messages/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= MESSAGE REACTION ENDPOINTS =============

  @Post('channels/:channelId/messages/:id/reactions')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 reactions per minute
  async addReaction(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body() reactionDto: any,
    @Request() req: any,
  ) {
    const reactionData = {
      ...reactionDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'message',
      `/channels/${channelId}/messages/${id}/reactions`,
      reactionData,
      config,
    );
    return response.data;
  }

  @Delete('channels/:channelId/messages/:id/reactions')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 reactions per minute
  async removeReaction(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body() reactionDto: any,
    @Request() req: any,
  ) {
    const reactionData = {
      ...reactionDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'message',
      `/channels/${channelId}/messages/${id}/reactions?userId=${req.user.id}`,
      {
        ...config,
        data: reactionData,
      },
    );
    return response.data;
  }

  // ============= DIRECT MESSAGE ENDPOINTS =============

  @Post('dm/send')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 messages per minute
  async sendDirectMessage(@Body() messageDto: any, @Request() req: any) {
    const messageData = {
      ...messageDto,
      senderId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'message',
      '/dm/send',
      messageData,
      config,
    );
    return response.data;
  }

  @Get('dm/conversation/:userId')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getDirectMessageConversation(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'message',
      `/dm/conversation/${userId}?senderId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('dm/messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 edits per minute
  async editDirectMessage(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'message',
      `/dm/messages/${id}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('dm/messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 deletes per minute
  async deleteDirectMessage(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'message',
      `/dm/messages/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= MESSAGE THREAD ENDPOINTS =============

  @Post('channels/:channelId/messages/:id/threads')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 thread replies per minute
  async replyToThread(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body() replyDto: any,
    @Request() req: any,
  ) {
    const replyData = {
      ...replyDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'message',
      `/channels/${channelId}/messages/${id}/threads`,
      replyData,
      config,
    );
    return response.data;
  }

  @Get('channels/:channelId/messages/:id/threads')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getThreadReplies(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'message',
      `/channels/${channelId}/messages/${id}/threads?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= MESSAGE SEARCH ENDPOINTS =============

  @Get('messages/search')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 searches per minute
  async searchMessages(@Body() searchDto: any, @Request() req: any) {
    const searchData = {
      ...searchDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get('message', '/messages/search', {
      ...config,
      params: searchData,
    });
    return response.data;
  }
}
