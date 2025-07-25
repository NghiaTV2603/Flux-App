import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.userProfile.update({
      where: { userId },
      data: updateProfileDto,
    });
  }

  async updateStatus(userId: string, status: string) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.userProfile.update({
      where: { userId },
      data: { status },
    });
  }

  async searchUsers(query: string) {
    return this.prisma.userProfile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        userId: true,
        username: true,
        displayName: true,
        avatar: true,
        status: true,
      },
      take: 20,
    });
  }

  // Method to create profile when user registers (called from auth-service)
  async createProfile(data: { userId: string; username: string }) {
    return this.prisma.userProfile.create({
      data: {
        userId: data.userId,
        username: data.username,
      },
    });
  }

  // Method to check if profile exists
  async profileExists(userId: string): Promise<boolean> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    return !!profile;
  }

  // Method to update username when changed in auth-service
  async syncUsername(userId: string, username: string) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { username },
    });
  }
}
