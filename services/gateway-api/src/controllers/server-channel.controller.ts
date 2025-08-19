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
  @RateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }) // 5 servers per hour
  async createServer(@Body() createServerDto: any, @Request() req: any) {
    const serverData = {
      ...createServerDto,
      ownerId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      '/servers',
      serverData,
      config,
    );
    return response.data;
  }

  @Get('servers/my-servers')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getUserServers(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server-channel',
      `/servers/user/${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('servers/:id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getServer(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server-channel',
      `/servers/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:id')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateServer(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server-channel',
      `/servers/${id}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:id')
  @RateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 deletes per hour
  async deleteServer(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server-channel',
      `/servers/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('servers/join')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 joins per minute
  async joinServer(@Body() joinDto: any, @Request() req: any) {
    const joinData = {
      ...joinDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      '/servers/join',
      joinData,
      config,
    );
    return response.data;
  }

  @Post('servers/:id/invite')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 invites per minute
  async createInvite(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      `/servers/${id}/invite?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  // ============= MEMBER MANAGEMENT ENDPOINTS =============

  @Get('servers/:id/members')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getMembers(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server-channel',
      `/servers/${id}/members?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:id/members/:memberId')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server-channel',
      `/servers/${id}/members/${memberId}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:id/members/:memberId')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 kicks per minute
  async kickMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server-channel',
      `/servers/${id}/members/${memberId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= CHANNEL MANAGEMENT ENDPOINTS =============

  @Post('servers/:id/channels')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 channels per minute
  async createChannel(
    @Param('id') id: string,
    @Body() createChannelDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      `/servers/${id}/channels?userId=${req.user.id}`,
      createChannelDto,
      config,
    );
    return response.data;
  }

  @Get('servers/:id/channels')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannels(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server-channel',
      `/servers/${id}/channels?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('channels/:id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannel(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server-channel',
      `/channels/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('channels/:id')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateChannel(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server-channel',
      `/channels/${id}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('channels/:id')
  @RateLimit({ limit: 5, windowMs: 60 * 1000 }) // 5 deletes per minute
  async deleteChannel(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server-channel',
      `/channels/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('channels/:id/permissions')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async updateChannelPermissions(
    @Param('id') id: string,
    @Body() permissionsDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      `/channels/${id}/permissions?userId=${req.user.id}`,
      permissionsDto,
      config,
    );
    return response.data;
  }

  // ============= ROLE MANAGEMENT ENDPOINTS =============

  @Post('servers/:id/roles')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 roles per minute
  async createRole(
    @Param('id') id: string,
    @Body() createRoleDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      `/servers/${id}/roles?userId=${req.user.id}`,
      createRoleDto,
      config,
    );
    return response.data;
  }

  @Get('servers/:id/roles')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getRoles(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server-channel',
      `/servers/${id}/roles?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Patch('servers/:id/roles/:roleId')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server-channel',
      `/servers/${id}/roles/${roleId}?userId=${req.user.id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete('servers/:id/roles/:roleId')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 deletes per minute
  async deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server-channel',
      `/servers/${id}/roles/${roleId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Post('servers/:id/members/:memberId/roles/:roleId')
  @RateLimit({ limit: 30, windowMs: 60 * 1000 }) // 30 assigns per minute
  async assignRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server-channel',
      `/servers/${id}/members/${memberId}/roles/${roleId}?userId=${req.user.id}`,
      {},
      config,
    );
    return response.data;
  }

  @Delete('servers/:id/members/:memberId/roles/:roleId')
  @RateLimit({ limit: 30, windowMs: 60 * 1000 }) // 30 removes per minute
  async removeRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server-channel',
      `/servers/${id}/members/${memberId}/roles/${roleId}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }
}
