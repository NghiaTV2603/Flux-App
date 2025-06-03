import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

@Controller('users')
@UseGuards(AuthGuard, RateLimitGuard)
export class UserController {
  constructor(private readonly httpClient: HttpClientService) {}

  @Get(':id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getUserById(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get('user', `/users/${id}`, config);
    return response.data;
  }

  @Patch(':id')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.patch(
      'user',
      `/users/${id}`,
      updateDto,
      config,
    );
    return response.data;
  }

  @Get('status/:id')
  @RateLimit({ limit: 200, windowMs: 60 * 1000 }) // 200 requests per minute
  async getUserStatus(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'user',
      `/users/status/${id}`,
      config,
    );
    return response.data;
  }

  @Get()
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async searchUsers(@Query() query: any, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get('user', '/users/search', {
      ...config,
      params: query,
    });
    return response.data;
  }
}
