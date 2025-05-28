import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    updateStatus(id: string, status: string): Promise<{
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
    createProfile(data: {
        id: string;
        username: string;
    }): Promise<{
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
}
