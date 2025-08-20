import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

@Injectable()
export class UserClientService {
  private readonly logger = new Logger(UserClientService.name);
  private readonly userServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Default to user service port, can be configured via env
    this.userServiceUrl =
      this.configService.get<string>("userService.url") ||
      "http://localhost:3001";
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.userServiceUrl}/users/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`User not found: ${userId}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();

      return {
        id: userData.id,
        username: userData.username || `User${userId.slice(-4)}`,
        displayName:
          userData.displayName ||
          userData.username ||
          `User${userId.slice(-4)}`,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch user profile for ${userId}:`,
        error.message
      );

      // Return fallback user data if service is unavailable
      return {
        id: userId,
        username: `User${userId.slice(-4)}`,
        displayName: `User${userId.slice(-4)}`,
      };
    }
  }

  async getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>();

    try {
      // Try batch request first
      const response = await fetch(`${this.userServiceUrl}/users/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });

      if (response.ok) {
        const userData = await response.json();
        userData.forEach((user: any) => {
          profiles.set(user.id, {
            id: user.id,
            username: user.username || `User${user.id.slice(-4)}`,
            displayName:
              user.displayName || user.username || `User${user.id.slice(-4)}`,
            email: user.email,
            avatarUrl: user.avatarUrl,
          });
        });
        return profiles;
      }
    } catch (error) {
      this.logger.warn(
        "Batch user fetch failed, falling back to individual requests:",
        error.message
      );
    }

    // Fallback to individual requests
    const promises = userIds.map(async (userId) => {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        profiles.set(userId, profile);
      }
    });

    await Promise.allSettled(promises);
    return profiles;
  }
}
