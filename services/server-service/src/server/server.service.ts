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
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { CreateChannelDto } from "./dto/create-channel.dto";
import {
  ServerPermission,
  DEFAULT_PERMISSIONS,
  PermissionHelper,
  PERMISSION_BITS,
} from "./enums/permissions.enum";

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

    // Create server with roles and member in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create server
      const server = await tx.server.create({
        data: {
          ...createServerDto,
          inviteCode,
          ownerId: userId,
        },
      });

      // Create owner role
      const ownerRole = await tx.serverRole.create({
        data: {
          serverId: server.id,
          name: "Owner",
          type: "owner",
          color: "#ff0000",
          position: 100, // Highest position
          permissions: DEFAULT_PERMISSIONS.OWNER,
          isHoisted: true,
          isMentionable: false,
          isManaged: true,
        },
      });

      // Create default member role
      const memberRole = await tx.serverRole.create({
        data: {
          serverId: server.id,
          name: "Members",
          type: "member",
          color: "#99aab5",
          position: 0, // Lowest position
          permissions: DEFAULT_PERMISSIONS.MEMBER,
          isDefault: true,
          isHoisted: false,
          isMentionable: true,
          isManaged: true,
        },
      });

      // Create server member
      const serverMember = await tx.serverMember.create({
        data: {
          serverId: server.id,
          userId: userId,
          username: "Owner", // TODO: Get from user service
          displayName: "Owner",
        },
      });

      // Assign owner role to member
      await tx.memberRole.create({
        data: {
          memberId: serverMember.id,
          roleId: ownerRole.id,
          assignedBy: userId,
        },
      });

      // Create default channels
      const generalTextChannel = await tx.channel.create({
        data: {
          serverId: server.id,
          name: "general",
          type: "text",
          position: 0,
          isPrivate: false,
        },
      });

      const generalVoiceChannel = await tx.channel.create({
        data: {
          serverId: server.id,
          name: "General",
          type: "voice",
          position: 1,
          isPrivate: false,
        },
      });

      // Add owner to all channels automatically
      await tx.channelMember.createMany({
        data: [
          {
            channelId: generalTextChannel.id,
            userId: userId,
          },
          {
            channelId: generalVoiceChannel.id,
            userId: userId,
          },
        ],
      });

      return {
        server,
        roles: [ownerRole, memberRole],
        channels: [generalTextChannel, generalVoiceChannel],
        member: serverMember,
      };
    });

    // Publish events
    await this.rabbitMQ.publishServerCreated({
      serverId: result.server.id,
      serverName: result.server.name,
      ownerId: result.server.ownerId,
      inviteCode: result.server.inviteCode,
    });

    // Publish channel created events
    for (const channel of result.channels) {
      await this.rabbitMQ.publishChannelCreated({
        channelId: channel.id,
        serverId: result.server.id,
        name: channel.name,
        type: channel.type,
      });
    }

    return {
      ...result.server,
      roles: result.roles,
      channels: result.channels,
      members: [result.member],
    };
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

  // Helper function to get member permissions
  private async getMemberPermissions(
    serverId: string,
    userId: string
  ): Promise<bigint> {
    const member = await this.prisma.serverMember.findFirst({
      where: { serverId, userId },
      include: {
        memberRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!member) {
      return BigInt(0);
    }

    // Combine all role permissions
    let totalPermissions = BigInt(0);
    for (const memberRole of member.memberRoles) {
      totalPermissions |= memberRole.role.permissions;
    }

    return totalPermissions;
  }

  // Helper function to check if user has permission
  private async hasPermission(
    serverId: string,
    userId: string,
    permission: ServerPermission
  ): Promise<boolean> {
    const permissions = await this.getMemberPermissions(serverId, userId);
    return PermissionHelper.hasPermission(permissions, permission);
  }

  // ROLE MANAGEMENT

  // Create new role
  async createRole(
    serverId: string,
    createRoleDto: CreateRoleDto,
    userId: string
  ) {
    // Check if user has permission to manage roles
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_ROLES
      ))
    ) {
      throw new ForbiddenException("You don't have permission to manage roles");
    }

    // Convert permissions array to bitfield
    const permissionBitfield = createRoleDto.permissions.reduce(
      (acc, permission) => acc | PERMISSION_BITS[permission],
      BigInt(0)
    );

    const role = await this.prisma.serverRole.create({
      data: {
        serverId,
        name: createRoleDto.name,
        color: createRoleDto.color,
        position: createRoleDto.position || 0,
        permissions: permissionBitfield,
        isHoisted: createRoleDto.isHoisted || false,
        isMentionable: createRoleDto.isMentionable !== false,
        type: "custom",
      },
    });

    return {
      ...role,
      permissions: PermissionHelper.getPermissionList(role.permissions),
    };
  }

  // Update role
  async updateRole(
    serverId: string,
    roleId: string,
    updateRoleDto: UpdateRoleDto,
    userId: string
  ) {
    // Check if user has permission to manage roles
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_ROLES
      ))
    ) {
      throw new ForbiddenException("You don't have permission to manage roles");
    }

    const role = await this.prisma.serverRole.findFirst({
      where: { id: roleId, serverId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    // Cannot modify managed roles (owner, member)
    if (role.isManaged) {
      throw new ForbiddenException("Cannot modify managed roles");
    }

    const updateData: any = { ...updateRoleDto };

    // Convert permissions array to bitfield if provided
    if (updateRoleDto.permissions) {
      updateData.permissions = updateRoleDto.permissions.reduce(
        (acc, permission) => acc | PERMISSION_BITS[permission],
        BigInt(0)
      );
    }

    const updatedRole = await this.prisma.serverRole.update({
      where: { id: roleId },
      data: updateData,
    });

    return {
      ...updatedRole,
      permissions: PermissionHelper.getPermissionList(updatedRole.permissions),
    };
  }

  // Delete role
  async deleteRole(serverId: string, roleId: string, userId: string) {
    // Check if user has permission to manage roles
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_ROLES
      ))
    ) {
      throw new ForbiddenException("You don't have permission to manage roles");
    }

    const role = await this.prisma.serverRole.findFirst({
      where: { id: roleId, serverId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    // Cannot delete managed roles (owner, member)
    if (role.isManaged) {
      throw new ForbiddenException("Cannot delete managed roles");
    }

    await this.prisma.serverRole.delete({
      where: { id: roleId },
    });

    return { message: "Role deleted successfully" };
  }

  // Get server roles
  async getServerRoles(serverId: string, userId: string) {
    // Check if user is member of server
    await this.getServerById(serverId, userId);

    const roles = await this.prisma.serverRole.findMany({
      where: { serverId },
      orderBy: { position: "desc" },
    });

    return roles.map((role) => ({
      ...role,
      permissions: PermissionHelper.getPermissionList(role.permissions),
    }));
  }

  // Assign role to member
  async assignRoleToMember(
    serverId: string,
    memberId: string,
    roleId: string,
    userId: string
  ) {
    // Check if user has permission to manage roles
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_ROLES
      ))
    ) {
      throw new ForbiddenException("You don't have permission to manage roles");
    }

    // Check if role exists in server
    const role = await this.prisma.serverRole.findFirst({
      where: { id: roleId, serverId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    // Check if member exists in server
    const member = await this.prisma.serverMember.findFirst({
      where: { id: memberId, serverId },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    // Check if role is already assigned
    const existingMemberRole = await this.prisma.memberRole.findFirst({
      where: { memberId, roleId },
    });

    if (existingMemberRole) {
      throw new ConflictException("Role already assigned to member");
    }

    const memberRole = await this.prisma.memberRole.create({
      data: {
        memberId,
        roleId,
        assignedBy: userId,
      },
    });

    return { message: "Role assigned successfully", memberRole };
  }

  // Remove role from member
  async removeRoleFromMember(
    serverId: string,
    memberId: string,
    roleId: string,
    userId: string
  ) {
    // Check if user has permission to manage roles
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_ROLES
      ))
    ) {
      throw new ForbiddenException("You don't have permission to manage roles");
    }

    const memberRole = await this.prisma.memberRole.findFirst({
      where: {
        memberId,
        roleId,
        role: { serverId },
      },
      include: {
        role: true,
      },
    });

    if (!memberRole) {
      throw new NotFoundException("Member role assignment not found");
    }

    // Cannot remove owner role
    if (memberRole.role.type === "owner") {
      throw new ForbiddenException("Cannot remove owner role");
    }

    await this.prisma.memberRole.delete({
      where: { id: memberRole.id },
    });

    return { message: "Role removed successfully" };
  }

  // CHANNEL MANAGEMENT

  // Create new channel
  async createChannel(
    serverId: string,
    createChannelDto: CreateChannelDto,
    userId: string
  ) {
    // Check if user has permission to manage channels
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_CHANNELS
      ))
    ) {
      throw new ForbiddenException(
        "You don't have permission to manage channels"
      );
    }

    const channel = await this.prisma.channel.create({
      data: {
        serverId,
        ...createChannelDto,
      },
    });

    // If channel is public, add all server members to it
    if (!createChannelDto.isPrivate) {
      const serverMembers = await this.prisma.serverMember.findMany({
        where: { serverId },
        select: { userId: true },
      });

      if (serverMembers.length > 0) {
        await this.prisma.channelMember.createMany({
          data: serverMembers.map((member) => ({
            channelId: channel.id,
            userId: member.userId,
          })),
          skipDuplicates: true,
        });
      }
    } else {
      // For private channels, only add the creator and users with MANAGE_CHANNELS permission
      const membersWithChannelPermission =
        await this.prisma.serverMember.findMany({
          where: { serverId },
          include: {
            memberRoles: {
              include: {
                role: true,
              },
            },
          },
        });

      const allowedMembers = membersWithChannelPermission.filter((member) => {
        const totalPermissions = member.memberRoles.reduce(
          (acc, memberRole) => acc | memberRole.role.permissions,
          BigInt(0)
        );
        return PermissionHelper.hasPermission(
          totalPermissions,
          ServerPermission.MANAGE_CHANNELS
        );
      });

      if (allowedMembers.length > 0) {
        await this.prisma.channelMember.createMany({
          data: allowedMembers.map((member) => ({
            channelId: channel.id,
            userId: member.userId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Publish event
    await this.rabbitMQ.publishChannelCreated({
      channelId: channel.id,
      serverId,
      name: channel.name,
      type: channel.type,
    });

    return channel;
  }

  // Update channel
  async updateChannel(
    serverId: string,
    channelId: string,
    updateChannelDto: any,
    userId: string
  ) {
    // Check if user has permission to manage channels
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_CHANNELS
      ))
    ) {
      throw new ForbiddenException(
        "You don't have permission to manage channels"
      );
    }

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    const updatedChannel = await this.prisma.channel.update({
      where: { id: channelId },
      data: updateChannelDto,
    });

    return updatedChannel;
  }

  // Delete channel
  async deleteChannel(serverId: string, channelId: string, userId: string) {
    // Check if user has permission to manage channels
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_CHANNELS
      ))
    ) {
      throw new ForbiddenException(
        "You don't have permission to manage channels"
      );
    }

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    await this.prisma.channel.delete({
      where: { id: channelId },
    });

    return { message: "Channel deleted successfully" };
  }

  // Get server channels
  async getServerChannels(serverId: string, userId: string) {
    // Check if user is member of server
    await this.getServerById(serverId, userId);

    // Get user's permissions
    const userPermissions = await this.getMemberPermissions(serverId, userId);
    const canManageChannels = PermissionHelper.hasPermission(
      userPermissions,
      ServerPermission.MANAGE_CHANNELS
    );

    // Get channels user has access to
    const channels = await this.prisma.channel.findMany({
      where: {
        serverId,
        OR: [
          { isPrivate: false }, // Public channels
          canManageChannels ? { isPrivate: true } : {}, // Private channels if user can manage
          {
            isPrivate: true,
            channelMembers: {
              some: { userId },
            },
          }, // Private channels user is member of
        ],
      },
      include: {
        channelMembers: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { position: "asc" }],
    });

    return channels;
  }

  // Add member to channel (for private channels)
  async addMemberToChannel(
    serverId: string,
    channelId: string,
    targetUserId: string,
    userId: string
  ) {
    // Check if user has permission to manage channel members
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_CHANNEL_MEMBERS
      ))
    ) {
      throw new ForbiddenException(
        "You don't have permission to manage channel members"
      );
    }

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    // Check if target user is member of server
    const serverMember = await this.prisma.serverMember.findFirst({
      where: { serverId, userId: targetUserId },
    });

    if (!serverMember) {
      throw new NotFoundException("User is not a member of this server");
    }

    // Check if user is already in channel
    const existingChannelMember = await this.prisma.channelMember.findFirst({
      where: { channelId, userId: targetUserId },
    });

    if (existingChannelMember) {
      throw new ConflictException("User is already a member of this channel");
    }

    const channelMember = await this.prisma.channelMember.create({
      data: {
        channelId,
        userId: targetUserId,
      },
    });

    return { message: "Member added to channel successfully", channelMember };
  }

  // Remove member from channel
  async removeMemberFromChannel(
    serverId: string,
    channelId: string,
    targetUserId: string,
    userId: string
  ) {
    // Check if user has permission to manage channel members
    if (
      !(await this.hasPermission(
        serverId,
        userId,
        ServerPermission.MANAGE_CHANNEL_MEMBERS
      ))
    ) {
      throw new ForbiddenException(
        "You don't have permission to manage channel members"
      );
    }

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    const channelMember = await this.prisma.channelMember.findFirst({
      where: { channelId, userId: targetUserId },
    });

    if (!channelMember) {
      throw new NotFoundException("User is not a member of this channel");
    }

    await this.prisma.channelMember.delete({
      where: { id: channelMember.id },
    });

    return { message: "Member removed from channel successfully" };
  }

  // Get channel members
  async getChannelMembers(serverId: string, channelId: string, userId: string) {
    // Check if user has access to channel
    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    // Check if user can access this channel
    const userPermissions = await this.getMemberPermissions(serverId, userId);
    const canManageChannels = PermissionHelper.hasPermission(
      userPermissions,
      ServerPermission.MANAGE_CHANNELS
    );

    if (channel.isPrivate && !canManageChannels) {
      // Check if user is member of private channel
      const channelMember = await this.prisma.channelMember.findFirst({
        where: { channelId, userId },
      });

      if (!channelMember) {
        throw new ForbiddenException("You don't have access to this channel");
      }
    }

    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      include: {
        channel: {
          include: {
            server: {
              include: {
                members: {
                  where: { userId: { in: [] } }, // Will be filled dynamically
                },
              },
            },
          },
        },
      },
    });

    return members;
  }
}
