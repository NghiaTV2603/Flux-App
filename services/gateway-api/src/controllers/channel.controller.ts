import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

@Controller('channels')
@UseGuards(AuthGuard, RateLimitGuard)
export class ChannelController {
  constructor(private readonly httpClient: HttpClientService) {}

  @Get(':id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannel(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'channel',
      `/channels/${id}`,
      config,
    );
    return response.data;
  }

  @Patch(':id')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateChannel(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'channel',
      `/channels/${id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete(':id')
  @RateLimit({ limit: 5, windowMs: 60 * 1000 }) // 5 deletes per minute
  async deleteChannel(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'channel',
      `/channels/${id}`,
      config,
    );
    return response.data;
  }

  @Post(':id/permissions')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async updatePermissions(
    @Param('id') id: string,
    @Body() permissionsDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'channel',
      `/channels/${id}/permissions`,
      permissionsDto,
      config,
    );
    return response.data;
  }

  // Message related endpoints
  @Post(':channelId/messages')
  @RateLimit({ limit: 30, windowMs: 60 * 1000 }) // 30 messages per minute
  async sendMessage(
    @Param('channelId') channelId: string,
    @Body() messageDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'message',
      `/channels/${channelId}/messages`,
      messageDto,
      config,
    );
    return response.data;
  }

  @Get(':channelId/messages')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getMessages(
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'message',
      `/channels/${channelId}/messages`,
      config,
    );
    return response.data;
  }

  @Delete(':channelId/messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 deletes per minute
  async deleteMessage(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'message',
      `/channels/${channelId}/messages/${id}`,
      config,
    );
    return response.data;
  }

  @Patch(':channelId/messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 edits per minute
  async editMessage(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'message',
      `/channels/${channelId}/messages/${id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Post(':channelId/messages/:id/reactions')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 reactions per minute
  async addReaction(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Body() reactionDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'message',
      `/channels/${channelId}/messages/${id}/reactions`,
      reactionDto,
      config,
    );
    return response.data;
  }

  @Delete(':channelId/messages/:id/reactions')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 reactions per minute
  async removeReaction(
    @Param('channelId') channelId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'message',
      `/channels/${channelId}/messages/${id}/reactions`,
      config,
    );
    return response.data;
  }
}
