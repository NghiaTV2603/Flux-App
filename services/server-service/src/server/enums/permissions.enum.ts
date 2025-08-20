export enum ServerPermission {
  // Channel Management
  MANAGE_CHANNELS = "MANAGE_CHANNELS", // Create, edit, delete channels

  // Member Management
  MANAGE_MEMBERS = "MANAGE_MEMBERS", // Add/remove members from server
  MANAGE_CHANNEL_MEMBERS = "MANAGE_CHANNEL_MEMBERS", // Add/remove members from channels

  // Role Management
  MANAGE_ROLES = "MANAGE_ROLES", // Create, edit, delete roles

  // Server Management
  MANAGE_SERVER = "MANAGE_SERVER", // Edit server settings

  // Invite Management
  CREATE_INVITES = "CREATE_INVITES", // Create server invites

  // Basic permissions
  VIEW_CHANNELS = "VIEW_CHANNELS", // View public channels
  SEND_MESSAGES = "SEND_MESSAGES", // Send messages in channels
  CONNECT_VOICE = "CONNECT_VOICE", // Connect to voice channels
}

// Permission bit values for bitfield operations
export const PERMISSION_BITS = {
  [ServerPermission.MANAGE_CHANNELS]: BigInt(1 << 0), // 1
  [ServerPermission.MANAGE_MEMBERS]: BigInt(1 << 1), // 2
  [ServerPermission.MANAGE_CHANNEL_MEMBERS]: BigInt(1 << 2), // 4
  [ServerPermission.MANAGE_ROLES]: BigInt(1 << 3), // 8
  [ServerPermission.MANAGE_SERVER]: BigInt(1 << 4), // 16
  [ServerPermission.CREATE_INVITES]: BigInt(1 << 5), // 32
  [ServerPermission.VIEW_CHANNELS]: BigInt(1 << 6), // 64
  [ServerPermission.SEND_MESSAGES]: BigInt(1 << 7), // 128
  [ServerPermission.CONNECT_VOICE]: BigInt(1 << 8), // 256
};

// Default permission sets
export const DEFAULT_PERMISSIONS = {
  // Owner has all permissions
  OWNER: Object.values(PERMISSION_BITS).reduce(
    (acc, bit) => acc | bit,
    BigInt(0)
  ),

  // Default member permissions
  MEMBER:
    PERMISSION_BITS[ServerPermission.VIEW_CHANNELS] |
    PERMISSION_BITS[ServerPermission.SEND_MESSAGES] |
    PERMISSION_BITS[ServerPermission.CONNECT_VOICE],

  // Admin permissions (all except server management)
  ADMIN:
    PERMISSION_BITS[ServerPermission.MANAGE_CHANNELS] |
    PERMISSION_BITS[ServerPermission.MANAGE_MEMBERS] |
    PERMISSION_BITS[ServerPermission.MANAGE_CHANNEL_MEMBERS] |
    PERMISSION_BITS[ServerPermission.MANAGE_ROLES] |
    PERMISSION_BITS[ServerPermission.CREATE_INVITES] |
    PERMISSION_BITS[ServerPermission.VIEW_CHANNELS] |
    PERMISSION_BITS[ServerPermission.SEND_MESSAGES] |
    PERMISSION_BITS[ServerPermission.CONNECT_VOICE],
};

// Helper functions for permission checking
export class PermissionHelper {
  static hasPermission(
    userPermissions: bigint,
    permission: ServerPermission
  ): boolean {
    return (userPermissions & PERMISSION_BITS[permission]) !== BigInt(0);
  }

  static addPermission(
    currentPermissions: bigint,
    permission: ServerPermission
  ): bigint {
    return currentPermissions | PERMISSION_BITS[permission];
  }

  static removePermission(
    currentPermissions: bigint,
    permission: ServerPermission
  ): bigint {
    return currentPermissions & ~PERMISSION_BITS[permission];
  }

  static hasAnyPermission(
    userPermissions: bigint,
    permissions: ServerPermission[]
  ): boolean {
    return permissions.some((permission) =>
      this.hasPermission(userPermissions, permission)
    );
  }

  static hasAllPermissions(
    userPermissions: bigint,
    permissions: ServerPermission[]
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(userPermissions, permission)
    );
  }

  static getPermissionList(permissions: bigint): ServerPermission[] {
    return Object.entries(PERMISSION_BITS)
      .filter(([, bit]) => (permissions & bit) !== BigInt(0))
      .map(([permission]) => permission as ServerPermission);
  }
}
