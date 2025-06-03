import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

@Controller('friends')
@UseGuards(AuthGuard, RateLimitGuard)
export class FriendController {
  constructor(private readonly httpClient: HttpClientService) {}

  @Post('request')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 friend requests per minute
  async sendFriendRequest(@Body() requestDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'friend',
      '/friends/request',
      requestDto,
      config,
    );
    return response.data;
  }

  @Post('accept')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 accepts per minute
  async acceptFriendRequest(@Body() acceptDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'friend',
      '/friends/accept',
      acceptDto,
      config,
    );
    return response.data;
  }

  @Post('block')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 blocks per minute
  async blockUser(@Body() blockDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'friend',
      '/friends/block',
      blockDto,
      config,
    );
    return response.data;
  }

  @Delete('remove')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 removes per minute
  async removeFriend(@Body() removeDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete('friend', '/friends/remove', {
      ...config,
      data: removeDto,
    });
    return response.data;
  }

  @Get()
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getFriends(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get('friend', '/friends', config);
    return response.data;
  }

  @Get('pending')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getPendingRequests(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'friend',
      '/friends/pending',
      config,
    );
    return response.data;
  }

  @Get('blocked')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async getBlockedUsers(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'friend',
      '/friends/blocked',
      config,
    );
    return response.data;
  }
}
