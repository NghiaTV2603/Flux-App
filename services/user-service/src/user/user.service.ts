import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(id: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile;
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.userProfile.update({
      where: { id },
      data: updateProfileDto,
    });
  }

  async updateStatus(id: string, status: string) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.userProfile.update({
      where: { id },
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
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        status: true,
      },
      take: 20,
    });
  }

  async createProfile(data: { id: string; username: string }) {
    return this.prisma.userProfile.create({
      data: {
        id: data.id,
        username: data.username,
      },
    });
  }
}
