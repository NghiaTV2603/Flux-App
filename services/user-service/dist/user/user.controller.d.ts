import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUserProfile(id: string): Promise<{
        username: string;
        avatar: string | null;
        customStatus: string | null;
        bio: string | null;
        displayName: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<{
        username: string;
        avatar: string | null;
        customStatus: string | null;
        bio: string | null;
        displayName: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<{
        username: string;
        avatar: string | null;
        customStatus: string | null;
        bio: string | null;
        displayName: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    searchUsers(query: string): Promise<{
        username: string;
        avatar: string | null;
        displayName: string | null;
        id: string;
        status: string;
    }[]>;
}
