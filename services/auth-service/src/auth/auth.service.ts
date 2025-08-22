import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto, deviceInfo?: any) {
    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Publish user.created event to RabbitMQ
    try {
      await this.rabbitMQService.publishUserCreated({
        userId: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      this.logger.error('Failed to publish user.created event:', error);
      // Don't fail the registration if event publishing fails
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceInfo);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, deviceInfo?: any) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceInfo);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordReset.create({
      data: {
        email,
        token: resetToken,
        expiresAt,
      },
    });

    // TODO: Send email with reset token
    // await this.emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (
      !resetRecord ||
      resetRecord.used ||
      resetRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await this.prisma.user.update({
      where: { email: resetRecord.email },
      data: { passwordHash },
    });

    // Mark reset token as used
    await this.prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    });

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string, deviceInfo?: any) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const sessionRecord = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Update last used timestamp
    await this.prisma.userSession.update({
      where: { id: sessionRecord.id },
      data: {
        lastUsedAt: new Date(),
        deviceInfo: deviceInfo || sessionRecord.deviceInfo,
      },
    });

    // Update Redis session with new expiry
    const sessionData = {
      userId: sessionRecord.userId,
      deviceInfo: deviceInfo || sessionRecord.deviceInfo,
      createdAt: sessionRecord.createdAt.toISOString(),
      lastUsedAt: new Date().toISOString(),
      expiresAt: sessionRecord.expiresAt.toISOString(),
    };

    // Refresh Redis session with new TTL (1 hour)
    await this.redisService.setUserSession(
      sessionRecord.userId,
      sessionData,
      3600,
    );

    // Generate new access token
    const accessToken = await this.generateAccessToken(sessionRecord.userId);

    return {
      accessToken,
      refreshToken, // Return the same refresh token
    };
  }

  private async generateTokens(userId: string, deviceInfo?: any) {
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Store user session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        deviceInfo: deviceInfo || null,
        expiresAt,
      },
    });

    // CRITICAL: Also store session in Redis for AuthGuard validation
    const sessionData = {
      userId,
      deviceInfo: deviceInfo || null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store with same TTL as JWT access token (1 hour = 3600 seconds)
    await this.redisService.setUserSession(userId, sessionData, 3600);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateAccessToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash },
    });

    if (session) {
      // Remove from database
      await this.prisma.userSession.delete({
        where: { id: session.id },
      });

      // Remove from Redis
      await this.redisService.deleteUserSession(session.userId);
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.userSession.deleteMany({
      where: { userId },
    });

    // Remove from Redis
    await this.redisService.deleteUserSession(userId);

    return { message: 'Logged out from all devices successfully' };
  }

  async getUserSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        deviceInfo: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.delete({
      where: { id: sessionId },
    });

    return { message: 'Session revoked successfully' };
  }

  async cleanupExpiredSessions() {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
    return result;
  }
}
