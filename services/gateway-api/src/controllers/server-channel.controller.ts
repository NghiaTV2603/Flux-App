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
 * Server & Channel Controller - Handles servers, channels, roles, permissions
 * Routes requests to Server & Channel Service
 * Includes: servers, channels, roles, permissions, members
 */
@Controller()
@UseGuards(AuthGuard, RateLimitGuard)
export class ServerChannelController {
  constructor(private readonly httpClient: HttpClientService) {}

  // ============= SERVER MANAGEMENT ENDPOINTS =============

  @Post('servers')
  @RateLimit({ limit: 1000, windowMs: 60 * 60 * 1000 }) // 5 servers per hour
  async createServer(@Body() createServerDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers?userId=${req.user.id}`,
      createServerDto,
      config,
    );
    return response.data;
  }

  @Get('servers/my-servers')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 50 requests per minute
  async getUserServers(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/user/${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('servers/:id')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 100 requests per minute
  async getServer(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:id')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateServer(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server',
      `/servers/${id}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:id')
  @RateLimit({ limit: 1000, windowMs: 60 * 60 * 1000 }) // 3 deletes per hour
  async deleteServer(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('servers/join')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 20 joins per minute
  async joinServer(@Body() joinDto: any, @Request() req: any) {
    const joinData = {
      ...joinDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      '/servers/join',
      joinData,
      config,
    );
    return response.data;
  }

  @Post('servers/:id/invite')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 10 invites per minute
  async createInvite(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${id}/invite?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  // ============= MEMBER MANAGEMENT ENDPOINTS =============

  @Get('servers/:id/members')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 50 requests per minute
  async getMembers(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${id}/members?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:id/members/:memberId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 20 requests per minute
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server',
      `/servers/${id}/members/${memberId}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:id/members/:memberId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 10 kicks per minute
  async kickMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${id}/members/${memberId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= CHANNEL MANAGEMENT ENDPOINTS =============

  @Post('servers/:id/channels')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 20 channels per minute
  async createChannel(
    @Param('id') id: string,
    @Body() createChannelDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${id}/channels?userId=${req.user.id}`,
      createChannelDto,
      config,
    );
    return response.data;
  }

  @Get('servers/:id/channels')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannels(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${id}/channels?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('servers/:serverId/channels/:channelId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${serverId}/channels/${channelId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:serverId/channels/:channelId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server',
      `/servers/${serverId}/channels/${channelId}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:serverId/channels/:channelId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 5 deletes per minute
  async deleteChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${serverId}/channels/${channelId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= CHANNEL MEMBER MANAGEMENT ENDPOINTS =============

  @Get('servers/:serverId/channels/:channelId/members')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 50 requests per minute
  async getChannelMembers(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${serverId}/channels/${channelId}/members?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('servers/:serverId/channels/:channelId/members')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 30 requests per minute
  async addMemberToChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body('targetUserId') targetUserId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${serverId}/channels/${channelId}/members?userId=${req.user.id}`,
      { targetUserId },
      config,
    );
    return response.data;
  }

  @Delete('servers/:serverId/channels/:channelId/members/:targetUserId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 20 requests per minute
  async removeMemberFromChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Param('targetUserId') targetUserId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${serverId}/channels/${channelId}/members/${targetUserId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= ROLE MANAGEMENT ENDPOINTS =============

  @Post('servers/:id/roles')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 10 roles per minute
  async createRole(
    @Param('id') id: string,
    @Body() createRoleDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${id}/roles?userId=${req.user.id}`,
      createRoleDto,
      config,
    );
    return response.data;
  }

  @Get('servers/:id/roles')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 50 requests per minute
  async getRoles(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${id}/roles?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:id/roles/:roleId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 20 requests per minute
  async updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server',
      `/servers/${id}/roles/${roleId}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:id/roles/:roleId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 10 deletes per minute
  async deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${id}/roles/${roleId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('servers/:id/members/:memberId/roles/:roleId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 30 assigns per minute
  async assignRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${id}/members/${memberId}/roles/${roleId}?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  @Delete('servers/:id/members/:memberId/roles/:roleId')
  @RateLimit({ limit: 1000, windowMs: 60 * 1000 }) // 30 removes per minute
  async removeRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${id}/members/${memberId}/roles/${roleId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }
}
