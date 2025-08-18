import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";
import { CreateServerDto } from "./dto/create-server.dto";
import { UpdateServerDto } from "./dto/update-server.dto";
import { JoinServerDto } from "./dto/join-server.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ServerService {
  constructor(
    private prisma: PrismaService,
    private rabbitMQ: RabbitMQService
  ) {}

  // Helper function to check if member has role
  private hasRole(member: any, roleName: string): boolean {
    if (!member.roles || !Array.isArray(member.roles)) return false;
    return member.roles.some((role: any) => role.name === roleName);
  }

  // Helper function to get member's primary role
  private getMemberRole(member: any): string {
    if (!member.roles || !Array.isArray(member.roles)) return "member";

    // Priority: owner > admin > member
    if (member.roles.some((role: any) => role.name === "owner")) return "owner";
    if (member.roles.some((role: any) => role.name === "admin")) return "admin";
    return "member";
  }

  // Generate unique invite code
  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create new server
  async createServer(createServerDto: CreateServerDto, userId: string) {
    const inviteCode = this.generateInviteCode();

    const server = await this.prisma.server.create({
      data: {
        ...createServerDto,
        inviteCode,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            username: "Owner", // TODO: Get from user service
            displayName: "Owner",
            roles: [{ name: "owner", id: "owner-role" }], // JSON array
          },
        },
      },
      include: {
        members: true,
      },
    });

    // Publish event
    await this.rabbitMQ.publishServerCreated({
      serverId: server.id,
      serverName: server.name,
      ownerId: server.ownerId,
      inviteCode: server.inviteCode,
    });

    return server;
  }

  // Get server by ID
  async getServerById(id: string, userId?: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!server) {
      throw new NotFoundException("Server not found");
    }

    // Check if user is member (if userId provided)
    if (userId) {
      const isMember = server.members.some(
        (member) => member.userId === userId
      );
      if (!isMember) {
        throw new ForbiddenException("You are not a member of this server");
      }
    }

    return server;
  }

  // Update server
  async updateServer(
    id: string,
    updateServerDto: UpdateServerDto,
    userId: string
  ) {
    const server = await this.getServerById(id);

    // Check if user is owner or admin
    const member = server.members.find((m) => m.userId === userId);
    if (
      !member ||
      (!this.hasRole(member, "owner") && !this.hasRole(member, "admin"))
    ) {
      throw new ForbiddenException(
        "Only server owners and admins can update server"
      );
    }

    const updatedServer = await this.prisma.server.update({
      where: { id },
      data: updateServerDto,
      include: {
        members: true,
      },
    });

    // Publish event
    await this.rabbitMQ.publishServerUpdated({
      serverId: updatedServer.id,
      serverName: updatedServer.name,
      updatedBy: userId,
    });

    return updatedServer;
  }

  // Delete server
  async deleteServer(id: string, userId: string) {
    const server = await this.getServerById(id);

    // Only owner can delete server
    if (server.ownerId !== userId) {
      throw new ForbiddenException("Only server owner can delete server");
    }

    await this.prisma.server.delete({
      where: { id },
    });

    // Publish event
    await this.rabbitMQ.publishServerDeleted({
      serverId: id,
      serverName: server.name,
      ownerId: userId,
    });

    return { message: "Server deleted successfully" };
  }

  // Join server by invite code
  async joinServer(joinServerDto: JoinServerDto) {
    const { inviteCode, userId } = joinServerDto;

    const server = await this.prisma.server.findUnique({
      where: { inviteCode },
      include: {
        members: true,
      },
    });

    if (!server) {
      throw new NotFoundException("Invalid invite code");
    }

    // Check if user is already a member
    const existingMember = server.members.find(
      (member) => member.userId === userId
    );
    if (existingMember) {
      throw new ConflictException("You are already a member of this server");
    }

    // Add user as member
    const newMember = await this.prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId,
        username: "Member", // TODO: Get from user service
        displayName: "Member",
        roles: [{ name: "member", id: "member-role" }], // JSON array
      },
    });

    // Publish event
    await this.rabbitMQ.publishMemberJoined({
      serverId: server.id,
      serverName: server.name,
      userId,
      memberId: newMember.id,
    });

    return {
      message: "Successfully joined server",
      server: {
        id: server.id,
        name: server.name,
        description: server.description,
        icon: server.iconUrl,
      },
    };
  }

  // Generate new invite code
  async generateNewInviteCode(serverId: string, userId: string) {
    const server = await this.getServerById(serverId);

    // Check if user is owner or admin
    const member = server.members.find((m) => m.userId === userId);
    if (
      !member ||
      (!this.hasRole(member, "owner") && !this.hasRole(member, "admin"))
    ) {
      throw new ForbiddenException(
        "Only server owners and admins can generate invite codes"
      );
    }

    const newInviteCode = this.generateInviteCode();

    const updatedServer = await this.prisma.server.update({
      where: { id: serverId },
      data: { inviteCode: newInviteCode },
    });

    return { inviteCode: updatedServer.inviteCode };
  }

  // Get server members
  async getServerMembers(serverId: string, userId: string) {
    const server = await this.getServerById(serverId, userId);
    return server.members;
  }

  // Update member info
  async updateMember(
    serverId: string,
    memberId: string,
    updateMemberDto: UpdateMemberDto,
    userId: string
  ) {
    const server = await this.getServerById(serverId);

    // Check if user is owner or admin
    const requester = server.members.find((m) => m.userId === userId);
    if (
      !requester ||
      (!this.hasRole(requester, "owner") && !this.hasRole(requester, "admin"))
    ) {
      throw new ForbiddenException(
        "Only server owners and admins can update members"
      );
    }

    // Get target member
    const targetMember = server.members.find((m) => m.id === memberId);
    if (!targetMember) {
      throw new NotFoundException("Member not found");
    }

    // TODO: Implement role validation based on roleIds when needed
    // For now, we'll just update the nickname if provided

    const updatedMember = await this.prisma.serverMember.update({
      where: { id: memberId },
      data: updateMemberDto,
    });

    // Publish event
    await this.rabbitMQ.publishMemberUpdated({
      serverId,
      memberId,
      userId: targetMember.userId,
      updatedBy: userId,
      changes: updateMemberDto,
    });

    return updatedMember;
  }

  // Remove member from server
  async removeMember(serverId: string, memberId: string, userId: string) {
    const server = await this.getServerById(serverId);

    // Check if user is owner or admin
    const requester = server.members.find((m) => m.userId === userId);
    if (
      !requester ||
      (!this.hasRole(requester, "owner") && !this.hasRole(requester, "admin"))
    ) {
      throw new ForbiddenException(
        "Only server owners and admins can remove members"
      );
    }

    // Get target member
    const targetMember = server.members.find((m) => m.id === memberId);
    if (!targetMember) {
      throw new NotFoundException("Member not found");
    }

    // Cannot remove owner
    if (this.hasRole(targetMember, "owner")) {
      throw new ForbiddenException("Cannot remove server owner");
    }

    // Only owner can remove admin
    if (
      this.hasRole(targetMember, "admin") &&
      !this.hasRole(requester, "owner")
    ) {
      throw new ForbiddenException("Only server owner can remove admins");
    }

    await this.prisma.serverMember.delete({
      where: { id: memberId },
    });

    // Publish event
    await this.rabbitMQ.publishMemberLeft({
      serverId,
      memberId,
      userId: targetMember.userId,
      removedBy: userId,
    });

    return { message: "Member removed successfully" };
  }

  // Get servers for user
  async getUserServers(userId: string) {
    const members = await this.prisma.serverMember.findMany({
      where: { userId },
      include: {
        server: true,
      },
    });

    return members.map((member) => ({
      ...member.server,
      memberRole: this.getMemberRole(member),
      joinedAt: member.joinedAt,
    }));
  }
}
