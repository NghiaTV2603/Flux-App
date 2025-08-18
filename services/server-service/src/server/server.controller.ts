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
}
