import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import {
  SendFriendRequestDto,
  RespondFriendRequestDto,
  RemoveFriendDto,
} from './dto/friend-request.dto';
import { BlockUserDto, UnblockUserDto } from './dto/block-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  async getUserProfile(@Param('userId') userId: string) {
    return this.userService.getUserProfile(userId);
  }

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  @Patch(':userId/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('userId') userId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.userService.updateStatus(userId, updateStatusDto);
  }

  @Get('status/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserStatus(@Param('userId') userId: string) {
    const profile = await this.userService.getUserProfile(userId);
    return {
      userId: profile.userId,
      status: profile.status,
      customStatus: profile.customStatus,
      lastSeenAt: profile.lastSeenAt,
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchUsers(
    @Query('q') query: string,
    @Query('currentUserId') currentUserId?: string,
  ) {
    return this.userService.searchUsers(query, currentUserId);
  }

  // ============= FRIEND MANAGEMENT ENDPOINTS =============

  @Post('friends/request')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @Query('requesterId') requesterId: string,
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    return this.userService.sendFriendRequest(
      requesterId,
      sendFriendRequestDto,
    );
  }

  @Post('friends/respond')
  @HttpCode(HttpStatus.OK)
  async respondToFriendRequest(
    @Query('userId') userId: string,
    @Body() respondDto: RespondFriendRequestDto,
  ) {
    return this.userService.respondToFriendRequest(userId, respondDto);
  }

  @Delete('friends/remove')
  @HttpCode(HttpStatus.OK)
  async removeFriend(
    @Query('userId') userId: string,
    @Body() removeDto: RemoveFriendDto,
  ) {
    return this.userService.removeFriend(userId, removeDto.friendId);
  }

  @Get('friends')
  @HttpCode(HttpStatus.OK)
  async getFriends(@Query('userId') userId: string) {
    return this.userService.getFriends(userId);
  }

  @Get('friends/pending')
  @HttpCode(HttpStatus.OK)
  async getPendingFriendRequests(@Query('userId') userId: string) {
    return this.userService.getPendingFriendRequests(userId);
  }

  @Get('friends/sent')
  @HttpCode(HttpStatus.OK)
  async getSentFriendRequests(@Query('userId') userId: string) {
    return this.userService.getSentFriendRequests(userId);
  }

  // ============= BLOCK MANAGEMENT ENDPOINTS =============

  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  async blockUser(
    @Query('blockerId') blockerId: string,
    @Body() blockUserDto: BlockUserDto,
  ) {
    return this.userService.blockUser(blockerId, blockUserDto);
  }

  @Delete('unblock')
  @HttpCode(HttpStatus.OK)
  async unblockUser(
    @Query('blockerId') blockerId: string,
    @Body() unblockUserDto: UnblockUserDto,
  ) {
    return this.userService.unblockUser(blockerId, unblockUserDto);
  }

  @Get('blocked')
  @HttpCode(HttpStatus.OK)
  async getBlockedUsers(@Query('userId') userId: string) {
    return this.userService.getBlockedUsers(userId);
  }

  // ============= USER SETTINGS ENDPOINTS =============

  @Get(':userId/settings')
  @HttpCode(HttpStatus.OK)
  async getUserSettings(@Param('userId') userId: string) {
    return this.userService.getUserSettings(userId);
  }

  @Patch(':userId/settings')
  @HttpCode(HttpStatus.OK)
  async updateUserSettings(
    @Param('userId') userId: string,
    @Body() updateSettingsDto: any,
  ) {
    return this.userService.updateUserSettings(userId, updateSettingsDto);
  }

  // ============= USER ACTIVITY ENDPOINTS =============

  @Post(':userId/activities')
  @HttpCode(HttpStatus.CREATED)
  async createUserActivity(
    @Param('userId') userId: string,
    @Body() createActivityDto: any,
  ) {
    return this.userService.createUserActivity(userId, createActivityDto);
  }

  @Get(':userId/activities')
  @HttpCode(HttpStatus.OK)
  async getUserActivities(@Param('userId') userId: string) {
    return this.userService.getUserActivities(userId);
  }

  @Delete(':userId/activities')
  @HttpCode(HttpStatus.OK)
  async clearUserActivity(
    @Param('userId') userId: string,
    @Query('activityType') activityType?: string,
  ) {
    return this.userService.clearUserActivity(userId, activityType);
  }
}
