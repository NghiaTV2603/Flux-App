"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserProfile(id) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { id },
        });
        if (!profile) {
            throw new common_1.NotFoundException('User profile not found');
        }
        return profile;
    }
    async updateProfile(id, updateProfileDto) {
        const existingProfile = await this.prisma.userProfile.findUnique({
            where: { id },
        });
        if (!existingProfile) {
            throw new common_1.NotFoundException('User profile not found');
        }
        return this.prisma.userProfile.update({
            where: { id },
            data: updateProfileDto,
        });
    }
    async updateStatus(id, status) {
        const existingProfile = await this.prisma.userProfile.findUnique({
            where: { id },
        });
        if (!existingProfile) {
            throw new common_1.NotFoundException('User profile not found');
        }
        return this.prisma.userProfile.update({
            where: { id },
            data: { status },
        });
    }
    async searchUsers(query) {
        return this.prisma.userProfile.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
            },
            take: 20,
        });
    }
    async createProfile(data) {
        return this.prisma.userProfile.create({
            data: {
                id: data.id,
                username: data.username,
            },
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map