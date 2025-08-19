import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ServerService } from "./server.service";
import { CreateServerDto } from "./dto/create-server.dto";
import { UpdateServerDto } from "./dto/update-server.dto";
import { JoinServerDto } from "./dto/join-server.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { UpdateChannelDto } from "./dto/update-channel.dto";

@Controller("servers")
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  // Create new server
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createServer(
    @Body() createServerDto: CreateServerDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.createServer(createServerDto, userId);
  }

  // Get user's servers
  @Get("user/:userId")
  async getUserServers(@Param("userId") userId: string) {
    return this.serverService.getUserServers(userId);
  }

  // Get server by ID
  @Get(":id")
  async getServerById(
    @Param("id") id: string,
    @Query("userId") userId?: string
  ) {
    return this.serverService.getServerById(id, userId);
  }

  // Update server
  @Patch(":id")
  async updateServer(
    @Param("id") id: string,
    @Body() updateServerDto: UpdateServerDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.updateServer(id, updateServerDto, userId);
  }

  // Delete server
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteServer(@Param("id") id: string, @Query("userId") userId: string) {
    return this.serverService.deleteServer(id, userId);
  }

  // Join server by invite code
  @Post("join")
  async joinServer(@Body() joinServerDto: JoinServerDto) {
    return this.serverService.joinServer(joinServerDto);
  }

  // Generate new invite code
  @Post(":id/invite")
  async generateInviteCode(
    @Param("id") serverId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.generateNewInviteCode(serverId, userId);
  }

  // Get server members
  @Get(":id/members")
  async getServerMembers(
    @Param("id") serverId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.getServerMembers(serverId, userId);
  }

  // Update member
  @Patch(":id/members/:memberId")
  async updateMember(
    @Param("id") serverId: string,
    @Param("memberId") memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.updateMember(
      serverId,
      memberId,
      updateMemberDto,
      userId
    );
  }

  // Remove member
  @Delete(":id/members/:memberId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param("id") serverId: string,
    @Param("memberId") memberId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.removeMember(serverId, memberId, userId);
  }

  // ROLE MANAGEMENT ENDPOINTS

  // Get server roles
  @Get(":id/roles")
  async getServerRoles(
    @Param("id") serverId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.getServerRoles(serverId, userId);
  }

  // Create new role
  @Post(":id/roles")
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Param("id") serverId: string,
    @Body() createRoleDto: CreateRoleDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.createRole(serverId, createRoleDto, userId);
  }

  // Update role
  @Patch(":id/roles/:roleId")
  async updateRole(
    @Param("id") serverId: string,
    @Param("roleId") roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.updateRole(serverId, roleId, updateRoleDto, userId);
  }

  // Delete role
  @Delete(":id/roles/:roleId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param("id") serverId: string,
    @Param("roleId") roleId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.deleteRole(serverId, roleId, userId);
  }

  // Assign role to member
  @Post(":id/members/:memberId/roles/:roleId")
  async assignRoleToMember(
    @Param("id") serverId: string,
    @Param("memberId") memberId: string,
    @Param("roleId") roleId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.assignRoleToMember(serverId, memberId, roleId, userId);
  }

  // Remove role from member
  @Delete(":id/members/:memberId/roles/:roleId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRoleFromMember(
    @Param("id") serverId: string,
    @Param("memberId") memberId: string,
    @Param("roleId") roleId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.removeRoleFromMember(serverId, memberId, roleId, userId);
  }

  // CHANNEL MANAGEMENT ENDPOINTS

  // Get server channels
  @Get(":id/channels")
  async getServerChannels(
    @Param("id") serverId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.getServerChannels(serverId, userId);
  }

  // Create new channel
  @Post(":id/channels")
  @HttpCode(HttpStatus.CREATED)
  async createChannel(
    @Param("id") serverId: string,
    @Body() createChannelDto: CreateChannelDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.createChannel(serverId, createChannelDto, userId);
  }

  // Update channel
  @Patch(":id/channels/:channelId")
  async updateChannel(
    @Param("id") serverId: string,
    @Param("channelId") channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
    @Query("userId") userId: string
  ) {
    return this.serverService.updateChannel(serverId, channelId, updateChannelDto, userId);
  }

  // Delete channel
  @Delete(":id/channels/:channelId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChannel(
    @Param("id") serverId: string,
    @Param("channelId") channelId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.deleteChannel(serverId, channelId, userId);
  }

  // Get channel members
  @Get(":id/channels/:channelId/members")
  async getChannelMembers(
    @Param("id") serverId: string,
    @Param("channelId") channelId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.getChannelMembers(serverId, channelId, userId);
  }

  // Add member to channel
  @Post(":id/channels/:channelId/members")
  async addMemberToChannel(
    @Param("id") serverId: string,
    @Param("channelId") channelId: string,
    @Body("targetUserId") targetUserId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.addMemberToChannel(serverId, channelId, targetUserId, userId);
  }

  // Remove member from channel
  @Delete(":id/channels/:channelId/members/:targetUserId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberFromChannel(
    @Param("id") serverId: string,
    @Param("channelId") channelId: string,
    @Param("targetUserId") targetUserId: string,
    @Query("userId") userId: string
  ) {
    return this.serverService.removeMemberFromChannel(serverId, channelId, targetUserId, userId);
  }
}
