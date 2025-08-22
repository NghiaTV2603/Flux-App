import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';
import { log } from 'console';

/**
 * User & Social Controller - Handles user profiles and social features
 * Routes requests to User & Social Service
 * Includes: user profiles, friends, blocking, social features
 */
@Controller()
@UseGuards(AuthGuard, RateLimitGuard)
export class UserSocialController {
  constructor(private readonly httpClient: HttpClientService) {}

  // ============= USER PROFILE ENDPOINTS =============

  @Get('users/:id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getUserById(@Param('id') id: string, @Request() req: any) {
    console.log('------ check data getUserById', id);
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'user-social',
      `/users/${id}`,
      config,
    );
    return response.data;
  }

  @Patch('users/:id')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'user-social',
      `/users/${id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Get('users/status/:id')
  @RateLimit({ limit: 200, windowMs: 60 * 1000 }) // 200 requests per minute
  async getUserStatus(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'user-social',
      `/users/status/${id}`,
      config,
    );
    return response.data;
  }

  @Get('users')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async searchUsers(@Query() query: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get('user-social', '/users/search', {
      ...config,
      params: query,
    });
    return response.data;
  }

  // ============= FRIEND MANAGEMENT ENDPOINTS =============

  @Post('friends/request')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 friend requests per minute
  async sendFriendRequest(@Body() requestDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'user-social',
      '/friends/request',
      requestDto,
      config,
    );
    return response.data;
  }

  @Post('friends/accept')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 accepts per minute
  async acceptFriendRequest(@Body() acceptDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'user-social',
      '/friends/accept',
      acceptDto,
      config,
    );
    return response.data;
  }

  @Post('friends/block')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 blocks per minute
  async blockUser(@Body() blockDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'user-social',
      '/friends/block',
      blockDto,
      config,
    );
    return response.data;
  }

  @Delete('friends/remove')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 removes per minute
  async removeFriend(@Body() removeDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'user-social',
      '/friends/remove',
      {
        ...config,
        data: removeDto,
      },
    );
    return response.data;
  }

  @Get('friends')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getFriends(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'user-social',
      '/friends',
      config,
    );
    return response.data;
  }

  @Get('friends/pending')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getPendingRequests(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'user-social',
      '/friends/pending',
      config,
    );
    return response.data;
  }

  @Get('friends/blocked')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async getBlockedUsers(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'user-social',
      '/friends/blocked',
      config,
    );
    return response.data;
  }
}
