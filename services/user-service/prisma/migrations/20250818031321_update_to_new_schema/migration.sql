/*
  Warnings:

  - You are about to drop the column `activity` on the `user_activities` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `user_activities` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `user_activities` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_activities` table. All the data in the column will be lost.
  - The primary key for the `user_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatar` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `customStatus` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_profiles` table. All the data in the column will be lost.
  - The `status` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `allowDirectMessages` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `allowFriendRequests` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notificationsEnabled` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `showOnlineStatus` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `soundEnabled` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_settings` table. All the data in the column will be lost.
  - Added the required column `activity_type` to the `user_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_settings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('online', 'offline', 'busy', 'away', 'invisible');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('playing', 'listening', 'watching', 'streaming', 'custom');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- DropIndex
DROP INDEX "user_settings_userId_key";

-- AlterTable
ALTER TABLE "user_activities" DROP COLUMN "activity",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
DROP COLUMN "userId",
ADD COLUMN     "activity_type" "ActivityType" NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "timestamps" JSONB,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_pkey",
DROP COLUMN "avatar",
DROP COLUMN "createdAt",
DROP COLUMN "customStatus",
DROP COLUMN "displayName",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD COLUMN     "activity" JSONB,
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "banner_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "custom_status" TEXT,
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "show_activity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'offline',
ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_pkey",
DROP COLUMN "allowDirectMessages",
DROP COLUMN "allowFriendRequests",
DROP COLUMN "id",
DROP COLUMN "language",
DROP COLUMN "notificationsEnabled",
DROP COLUMN "showOnlineStatus",
DROP COLUMN "soundEnabled",
DROP COLUMN "userId",
ADD COLUMN     "allow_direct_messages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_friend_requests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "privacy_settings" JSONB,
ADD COLUMN     "show_online_status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "addressee_id" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_directory" (
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL,
    "custom_status" TEXT,
    "show_online_status" BOOLEAN NOT NULL,
    "allow_friend_requests" BOOLEAN NOT NULL,
    "friend_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_directory_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "friend_lists_cache" (
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "friend_username" TEXT NOT NULL,
    "friend_display_name" TEXT,
    "friend_avatar_url" TEXT,
    "friend_status" "UserStatus" NOT NULL,
    "friendship_status" "FriendshipStatus" NOT NULL,
    "friendship_created_at" TIMESTAMP(3) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_lists_cache_pkey" PRIMARY KEY ("user_id","friend_id")
);

-- CreateIndex
CREATE INDEX "friendships_requester_id_status_idx" ON "friendships"("requester_id", "status");

-- CreateIndex
CREATE INDEX "friendships_addressee_id_status_idx" ON "friendships"("addressee_id", "status");

-- CreateIndex
CREATE INDEX "friendships_status_created_at_idx" ON "friendships"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requester_id_addressee_id_key" ON "friendships"("requester_id", "addressee_id");

-- CreateIndex
CREATE INDEX "blocks_blocker_id_created_at_idx" ON "blocks"("blocker_id", "created_at");

-- CreateIndex
CREATE INDEX "blocks_blocked_id_created_at_idx" ON "blocks"("blocked_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_blocker_id_blocked_id_key" ON "blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "user_directory_username_idx" ON "user_directory"("username");

-- CreateIndex
CREATE INDEX "user_directory_display_name_idx" ON "user_directory"("display_name");

-- CreateIndex
CREATE INDEX "friend_lists_cache_user_id_friendship_status_idx" ON "friend_lists_cache"("user_id", "friendship_status");

-- CreateIndex
CREATE INDEX "friend_lists_cache_friend_status_last_updated_idx" ON "friend_lists_cache"("friend_status", "last_updated");

-- CreateIndex
CREATE INDEX "user_activities_user_id_created_at_idx" ON "user_activities"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_activities_activity_type_created_at_idx" ON "user_activities"("activity_type", "created_at");

-- CreateIndex
CREATE INDEX "user_profiles_username_idx" ON "user_profiles"("username");

-- CreateIndex
CREATE INDEX "user_profiles_display_name_idx" ON "user_profiles"("display_name");

-- CreateIndex
CREATE INDEX "user_profiles_status_updated_at_idx" ON "user_profiles"("status", "updated_at");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
