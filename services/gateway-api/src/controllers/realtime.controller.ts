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
 * Realtime Controller - Handles WebSocket, voice calls, screen share, notifications
 * Routes requests to Realtime Service
 * Includes: WebSocket connections, voice sessions, notifications, presence
 */
@Controller()
@UseGuards(AuthGuard, RateLimitGuard)
export class RealtimeController {
  constructor(private readonly httpClient: HttpClientService) {}

  // ============= WEBSOCKET CONNECTION ENDPOINTS =============

  @Get('ws/connect')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 connections per minute
  async establishWebSocketConnection(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/ws/connect?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('ws/disconnect')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 disconnects per minute
  async disconnectWebSocket(@Body() disconnectDto: any, @Request() req: any) {
    const disconnectData = {
      ...disconnectDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      '/ws/disconnect',
      disconnectData,
      config,
    );
    return response.data;
  }

  // ============= VOICE CHANNEL ENDPOINTS =============

  @Post('voice/channels/:channelId/join')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 joins per minute
  async joinVoiceChannel(
    @Param('channelId') channelId: string,
    @Body() joinDto: any,
    @Request() req: any,
  ) {
    const joinData = {
      ...joinDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      `/voice/channels/${channelId}/join`,
      joinData,
      config,
    );
    return response.data;
  }

  @Post('voice/channels/:channelId/leave')
  @RateLimit({ limit: 30, windowMs: 60 * 1000 }) // 30 leaves per minute
  async leaveVoiceChannel(
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      `/voice/channels/${channelId}/leave?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  @Get('voice/channels/:channelId/users')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getVoiceChannelUsers(
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/voice/channels/${channelId}/users?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= VOICE CONTROL ENDPOINTS =============

  @Patch('voice/channels/:channelId/users/:userId/mute')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 mutes per minute
  async muteUser(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
    @Body() muteDto: any,
    @Request() req: any,
  ) {
    const muteData = {
      ...muteDto,
      moderatorId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'voice',
      `/voice/channels/${channelId}/users/${userId}/mute`,
      muteData,
      config,
    );
    return response.data;
  }

  @Patch('voice/channels/:channelId/users/:userId/deafen')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 deafens per minute
  async deafenUser(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
    @Body() deafenDto: any,
    @Request() req: any,
  ) {
    const deafenData = {
      ...deafenDto,
      moderatorId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'voice',
      `/voice/channels/${channelId}/users/${userId}/deafen`,
      deafenData,
      config,
    );
    return response.data;
  }

  // ============= SCREEN SHARING ENDPOINTS =============

  @Post('voice/channels/:channelId/screen-share/start')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 screen shares per minute
  async startScreenShare(
    @Param('channelId') channelId: string,
    @Body() screenShareDto: any,
    @Request() req: any,
  ) {
    const screenShareData = {
      ...screenShareDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      `/voice/channels/${channelId}/screen-share/start`,
      screenShareData,
      config,
    );
    return response.data;
  }

  @Post('voice/channels/:channelId/screen-share/stop')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 stops per minute
  async stopScreenShare(
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      `/voice/channels/${channelId}/screen-share/stop?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  // ============= NOTIFICATION ENDPOINTS =============

  @Get('notifications')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getNotifications(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/notifications?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('notifications/:id/read')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 marks per minute
  async markNotificationAsRead(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'voice',
      `/notifications/${id}/read?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  @Post('notifications/settings')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 updates per minute
  async updateNotificationSettings(
    @Body() settingsDto: any,
    @Request() req: any,
  ) {
    const settingsData = {
      ...settingsDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      '/notifications/settings',
      settingsData,
      config,
    );
    return response.data;
  }

  @Delete('notifications/:id')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 deletes per minute
  async deleteNotification(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'voice',
      `/notifications/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= PRESENCE & STATUS ENDPOINTS =============

  @Post('presence/update')
  @RateLimit({ limit: 60, windowMs: 60 * 1000 }) // 60 updates per minute
  async updatePresence(@Body() presenceDto: any, @Request() req: any) {
    const presenceData = {
      ...presenceDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      '/presence/update',
      presenceData,
      config,
    );
    return response.data;
  }

  @Get('presence/server/:serverId')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getServerPresence(
    @Param('serverId') serverId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/presence/server/${serverId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('presence/friends')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getFriendsPresence(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/presence/friends?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= TYPING INDICATOR ENDPOINTS =============

  @Post('typing/start')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 typing starts per minute
  async startTyping(@Body() typingDto: any, @Request() req: any) {
    const typingData = {
      ...typingDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      '/typing/start',
      typingData,
      config,
    );
    return response.data;
  }

  @Post('typing/stop')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 typing stops per minute
  async stopTyping(@Body() typingDto: any, @Request() req: any) {
    const typingData = {
      ...typingDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'voice',
      '/typing/stop',
      typingData,
      config,
    );
    return response.data;
  }

  // ============= VOICE SESSION ANALYTICS =============

  @Get('voice/analytics/sessions')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async getVoiceSessionAnalytics(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/voice/analytics/sessions?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('voice/analytics/usage')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async getVoiceUsageAnalytics(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'voice',
      `/voice/analytics/usage?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }
}
