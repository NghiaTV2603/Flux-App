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

@Controller('servers')
@UseGuards(AuthGuard, RateLimitGuard)
export class ServerController {
  constructor(private readonly httpClient: HttpClientService) {}

  @Post()
  @RateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }) // 5 servers per hour
  async createServer(@Body() createServerDto: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      '/servers',
      createServerDto,
      config,
    );
    return response.data;
  }

  @Get(':id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getServer(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${id}`,
      config,
    );
    return response.data;
  }

  @Patch(':id')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateServer(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server',
      `/servers/${id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete(':id')
  @RateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 deletes per hour
  async deleteServer(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${id}`,
      config,
    );
    return response.data;
  }

  @Post(':id/join')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 joins per minute
  async joinServer(
    @Param('id') id: string,
    @Body() joinDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${id}/join`,
      joinDto,
      config,
    );
    return response.data;
  }

  @Post(':id/invite')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 invites per minute
  async createInvite(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'server',
      `/servers/${id}/invite`,
      {},
      config,
    );
    return response.data;
  }

  @Get(':id/members')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getMembers(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'server',
      `/servers/${id}/members`,
      config,
    );
    return response.data;
  }

  @Patch(':id/members/:userId')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 requests per minute
  async updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'server',
      `/servers/${id}/members/${userId}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Delete(':id/members/:userId')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 kicks per minute
  async kickMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'server',
      `/servers/${id}/members/${userId}`,
      config,
    );
    return response.data;
  }

  // Channel related endpoints
  @Post(':id/channels')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 channels per minute
  async createChannel(
    @Param('id') id: string,
    @Body() createChannelDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'channel',
      `/servers/${id}/channels`,
      createChannelDto,
      config,
    );
    return response.data;
  }

  @Get(':id/channels')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getChannels(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'channel',
      `/servers/${id}/channels`,
      config,
    );
    return response.data;
  }
}
