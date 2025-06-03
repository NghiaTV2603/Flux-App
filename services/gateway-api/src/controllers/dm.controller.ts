import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

@Controller('dm')
@UseGuards(AuthGuard, RateLimitGuard)
export class DirectMessageController {
  constructor(private readonly httpClient: HttpClientService) {}

  @Post('send')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 messages per minute
  async sendDirectMessage(@Body() messageDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'dm',
      '/dm/send',
      messageDto,
      config,
    );
    return response.data;
  }

  @Get('conversation/:userId')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getConversation(@Param('userId') userId: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'dm',
      `/dm/conversation/${userId}`,
      config,
    );
    return response.data;
  }

  @Delete('messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 deletes per minute
  async deleteMessage(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'dm',
      `/dm/messages/${id}`,
      config,
    );
    return response.data;
  }

  @Patch('messages/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 edits per minute
  async editMessage(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'dm',
      `/dm/messages/${id}`,
      updateDto,
      config,
    );
    return response.data;
  }
}
