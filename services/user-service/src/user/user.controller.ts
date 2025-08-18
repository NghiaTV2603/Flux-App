import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

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

  @Get('search/:query')
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Param('query') query: string) {
    return this.userService.searchUsers(query);
  }
}
