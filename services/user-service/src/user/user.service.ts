import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import {
  SendFriendRequestDto,
  RespondFriendRequestDto,
} from './dto/friend-request.dto';
import { BlockUserDto, UnblockUserDto } from './dto/block-user.dto';
import {
  CreateUserActivityDto,
  UpdateUserActivityDto,
} from './dto/user-activity.dto';
import { UpdateUserSettingsDto } from './dto/user-settings.dto';
import { UserStatus, FriendshipStatus } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RabbitMQService))
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async getUserProfile(userId: string, includeSettings = false) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        settings: includeSettings,
        activities: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
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

    const updatedProfile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...updateProfileDto,
        lastSeenAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Publish profile updated event
    try {
      await this.rabbitMQService.publishUserProfileUpdated({
        userId,
        username: updatedProfile.username,
        displayName: updatedProfile.displayName || undefined,
        avatar: updatedProfile.avatarUrl || undefined,
        bio: updatedProfile.bio || undefined,
      });
    } catch (error) {
      this.logger.error('Failed to publish user.profile.updated event:', error);
    }

    return updatedProfile;
  }

  async updateStatus(userId: string, updateStatusDto: UpdateStatusDto) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    const updatedProfile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        status: updateStatusDto.status as UserStatus,
        customStatus: updateStatusDto.customStatus,
        lastSeenAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Publish status changed event
    try {
      await this.rabbitMQService.publishUserStatusChanged({
        userId,
        status: updatedProfile.status,
        customStatus: updatedProfile.customStatus || undefined,
      });
    } catch (error) {
      this.logger.error('Failed to publish user.status.changed event:', error);
    }

    return updatedProfile;
  }

  async searchUsers(query: string, currentUserId?: string) {
    const users = await this.prisma.userProfile.findMany({
      where: {
        AND: [
          currentUserId ? { userId: { not: currentUserId } } : {},
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        userId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        customStatus: true,
      },
      take: 20,
    });

    // If currentUserId is provided, check friendship status
    if (currentUserId) {
      const friendships = await this.prisma.friendship.findMany({
        where: {
          OR: [
            {
              requesterId: currentUserId,
              addresseeId: { in: users.map((u) => u.userId) },
            },
            {
              addresseeId: currentUserId,
              requesterId: { in: users.map((u) => u.userId) },
            },
          ],
        },
      });

      const blocks = await this.prisma.block.findMany({
        where: {
          OR: [
            {
              blockerId: currentUserId,
              blockedId: { in: users.map((u) => u.userId) },
            },
            {
              blockedId: currentUserId,
              blockerId: { in: users.map((u) => u.userId) },
            },
          ],
        },
      });

      return users.map((user) => {
        const friendship = friendships.find(
          (f) =>
            (f.requesterId === currentUserId &&
              f.addresseeId === user.userId) ||
            (f.addresseeId === currentUserId && f.requesterId === user.userId),
        );

        const block = blocks.find(
          (b) =>
            (b.blockerId === currentUserId && b.blockedId === user.userId) ||
            (b.blockedId === currentUserId && b.blockerId === user.userId),
        );

        return {
          ...user,
          relationshipStatus: block ? 'blocked' : friendship?.status || 'none',
          canSendFriendRequest: !friendship && !block,
        };
      });
    }

    return users;
  }

  // Method to create profile when user registers (called from auth-service)
  async createProfile(data: {
    userId: string;
    username: string;
    email?: string;
  }) {
    const profile = await this.prisma.userProfile.create({
      data: {
        userId: data.userId,
        username: data.username,
        email: data.email,
      },
    });

    // Create default user settings
    await this.prisma.userSettings.create({
      data: {
        userId: data.userId,
      },
    });

    return profile;
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

  // === USER SETTINGS ===
  async getUserSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exists
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateUserSettings(
    userId: string,
    updateSettingsDto: UpdateUserSettingsDto,
  ) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...updateSettingsDto },
      update: updateSettingsDto,
    });

    return settings;
  }

  // === FRIEND SYSTEM ===
  async sendFriendRequest(
    requesterId: string,
    sendFriendRequestDto: SendFriendRequestDto,
  ) {
    const { addresseeId, message } = sendFriendRequestDto;

    // Check if users exist
    const [requester, addressee] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId: requesterId } }),
      this.prisma.userProfile.findUnique({ where: { userId: addresseeId } }),
    ]);

    if (!requester || !addressee) {
      throw new NotFoundException('User not found');
    }

    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if they're blocked
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: requesterId, blockedId: addresseeId },
          { blockerId: addresseeId, blockedId: requesterId },
        ],
      },
    });

    if (block) {
      throw new BadRequestException(
        'Cannot send friend request to blocked user',
      );
    }

    // Check if friendship already exists
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException(
        'Friend request already exists or users are already friends',
      );
    }

    // Check addressee's privacy settings
    const addresseeSettings = await this.getUserSettings(addresseeId);
    if (!addresseeSettings.allowFriendRequests) {
      throw new BadRequestException('User does not accept friend requests');
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        message,
      },
      include: {
        requester: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Publish friend request event
    try {
      await this.rabbitMQService.publishFriendRequestSent({
        fromUserId: requesterId,
        toUserId: addresseeId,
        requestId: friendship.id,
      });
    } catch (error) {
      this.logger.error('Failed to publish friend.request.sent event:', error);
    }

    return friendship;
  }

  async respondToFriendRequest(
    userId: string,
    respondDto: RespondFriendRequestDto,
  ) {
    const { friendshipId, response } = respondDto;

    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        requester: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addresseeId !== userId) {
      throw new BadRequestException(
        'You can only respond to friend requests sent to you',
      );
    }

    if (friendship.status !== FriendshipStatus.pending) {
      throw new BadRequestException(
        'Friend request has already been responded to',
      );
    }

    const updatedFriendship = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: response as FriendshipStatus,
        respondedAt: new Date(),
      },
      include: {
        requester: true,
        addressee: true,
      },
    });

    // Publish friend request response event
    try {
      if (response === 'accepted') {
        await this.rabbitMQService.publishFriendRequestAccepted({
          fromUserId: friendship.requesterId,
          toUserId: friendship.addresseeId,
          requestId: friendshipId,
        });
      }
    } catch (error) {
      this.logger.error(
        'Failed to publish friend request response event:',
        error,
      );
    }

    return updatedFriendship;
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: FriendshipStatus.accepted },
          { addresseeId: userId, status: FriendshipStatus.accepted },
        ],
      },
      include: {
        requester: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            customStatus: true,
          },
        },
        addressee: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            customStatus: true,
          },
        },
      },
    });

    return friendships.map((friendship) => {
      const friend =
        friendship.requesterId === userId
          ? friendship.addressee
          : friendship.requester;
      return {
        friendshipId: friendship.id,
        friend,
        friendshipCreatedAt: friendship.createdAt,
      };
    });
  }

  async getPendingFriendRequests(userId: string) {
    const pendingRequests = await this.prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.pending,
      },
      include: {
        requester: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pendingRequests;
  }

  async getSentFriendRequests(userId: string) {
    const sentRequests = await this.prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: FriendshipStatus.pending,
      },
      include: {
        addressee: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sentRequests;
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: userId,
            addresseeId: friendId,
            status: FriendshipStatus.accepted,
          },
          {
            requesterId: friendId,
            addresseeId: userId,
            status: FriendshipStatus.accepted,
          },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend removed successfully' };
  }

  // === BLOCK SYSTEM ===
  async blockUser(blockerId: string, blockUserDto: BlockUserDto) {
    const { blockedId, reason } = blockUserDto;

    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const blockedUser = await this.prisma.userProfile.findUnique({
      where: { userId: blockedId },
    });

    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked');
    }

    // Remove existing friendship if any
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: blockerId, addresseeId: blockedId },
          { requesterId: blockedId, addresseeId: blockerId },
        ],
      },
    });

    const block = await this.prisma.block.create({
      data: {
        blockerId,
        blockedId,
        reason,
      },
      include: {
        blocked: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return block;
  }

  async unblockUser(blockerId: string, unblockUserDto: UnblockUserDto) {
    const { blockedId } = unblockUserDto;

    const block = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.prisma.block.delete({
      where: { id: block.id },
    });

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            userId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks;
  }

  // === USER ACTIVITIES ===
  async createUserActivity(
    userId: string,
    createActivityDto: CreateUserActivityDto,
  ) {
    // Remove existing activities of the same type
    await this.prisma.userActivity.deleteMany({
      where: {
        userId,
        activityType: createActivityDto.activityType,
      },
    });

    const activity = await this.prisma.userActivity.create({
      data: {
        userId,
        ...createActivityDto,
      },
    });

    // Update profile activity field for quick access
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        activity: {
          type: activity.activityType,
          name: activity.name,
          details: activity.details,
          state: activity.state,
        },
      },
    });

    return activity;
  }

  async updateUserActivity(
    userId: string,
    activityId: string,
    updateActivityDto: UpdateUserActivityDto,
  ) {
    const activity = await this.prisma.userActivity.findFirst({
      where: {
        id: activityId,
        userId,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const updatedActivity = await this.prisma.userActivity.update({
      where: { id: activityId },
      data: updateActivityDto,
    });

    return updatedActivity;
  }

  async clearUserActivity(userId: string, activityType?: string) {
    const whereClause: any = activityType
      ? { userId, activityType }
      : { userId };

    await this.prisma.userActivity.deleteMany({
      where: whereClause,
    });

    // Clear profile activity if clearing all activities
    if (!activityType) {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { activity: { unset: true } },
      });
    }

    return { message: 'Activity cleared successfully' };
  }

  async getUserActivities(userId: string) {
    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return activities;
  }

  // === CLEANUP METHODS ===
  async cleanupExpiredActivities() {
    const result = await this.prisma.userActivity.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired activities`);
    return result;
  }
}
