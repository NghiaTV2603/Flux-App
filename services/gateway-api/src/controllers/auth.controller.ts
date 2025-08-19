import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

/**
 * Auth Controller - Handles authentication and authorization
 * Routes all auth requests to Auth Service
 * Includes: register, login, OAuth, password reset, token refresh
 */
@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private readonly httpClient: HttpClientService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }) // 5 requests per 15 minutes
  async register(@Body() registerDto: any) {
    const response = await this.httpClient.post(
      'auth',
      '/auth/register',
      registerDto,
    );
    return response.data;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }) // 10 requests per 15 minutes
  async login(@Body() loginDto: any) {
    const response = await this.httpClient.post(
      'auth',
      '/auth/login',
      loginDto,
    );
    return response.data;
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }) // 10 requests per 15 minutes
  async oauth(@Body() oauthDto: any) {
    const response = await this.httpClient.post(
      'auth',
      '/auth/oauth',
      oauthDto,
    );
    return response.data;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 requests per hour
  async forgotPassword(@Body() forgotPasswordDto: any) {
    const response = await this.httpClient.post(
      'auth',
      '/auth/forgot-password',
      forgotPasswordDto,
    );
    return response.data;
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 requests per hour
  async resetPassword(@Body() resetPasswordDto: any) {
    const response = await this.httpClient.post(
      'auth',
      '/auth/reset-password',
      resetPasswordDto,
    );
    return response.data;
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 20, windowMs: 60 * 60 * 1000 }) // 20 requests per hour
  async refreshToken(@Body() refreshTokenDto: any) {
    const response = await this.httpClient.post(
      'auth',
      '/auth/refresh-token',
      refreshTokenDto,
    );
    return response.data;
  }
}
