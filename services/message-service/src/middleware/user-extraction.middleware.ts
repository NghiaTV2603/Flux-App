import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UserClientService,
  UserProfile,
} from '../services/user-client.service';
import { UserInfo } from '../types/user.types';

interface JwtPayload {
  sub?: string;
  id?: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request interface để include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserInfo;
  }
}

@Injectable()
export class UserExtractionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UserExtractionMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userClientService: UserClientService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract JWT token from Authorization header
      const token = this.extractTokenFromHeader(req);

      if (!token) {
        this.logger.warn('No authorization token provided');
        return next();
      }

      // Decode JWT token to get user ID
      const jwtSecret =
        this.configService.get<string>('security.jwtSecret') ||
        'your-super-secret-jwt-key-change-in-production';

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtSecret,
      });

      const userId = payload?.sub || payload?.id;

      if (!userId) {
        this.logger.warn('No user ID found in JWT payload');
        return next();
      }

      // Get user information from user-service
      const userProfile: UserProfile | null =
        await this.userClientService.getUserProfile(userId);

      if (!userProfile) {
        this.logger.warn(`User profile not found for userId: ${userId}`);
        return next();
      }

      // Map UserProfile to UserInfo and attach to request
      req.user = {
        id: userProfile.id,
        username: userProfile.username,
        displayName: userProfile.displayName,
        avatarUrl: userProfile.avatarUrl,
      };

      this.logger.debug(
        `User extracted successfully: ${userProfile.username} (${userProfile.id})`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to extract user from token:', errorMessage);
      // Continue without user - let endpoint decide how to handle
    }

    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
