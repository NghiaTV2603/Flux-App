-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('text', 'voice', 'category', 'announcement', 'stage', 'forum');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('none', 'low', 'medium', 'high', 'highest');

-- CreateEnum
CREATE TYPE "ContentFilter" AS ENUM ('disabled', 'members_without_roles', 'all_members');

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "banner_url" TEXT,
    "splash_url" TEXT,
    "owner_id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "max_members" INTEGER NOT NULL DEFAULT 100,
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'none',
    "content_filter" "ContentFilter" NOT NULL DEFAULT 'disabled',
    "features" JSONB,
    "emojis" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_members" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "nickname" TEXT,
    "roles" JSONB,
    "permissions" JSONB,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic" TEXT,
    "type" "ChannelType" NOT NULL DEFAULT 'text',
    "parent_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_nsfw" BOOLEAN NOT NULL DEFAULT false,
    "slowmode_delay" INTEGER NOT NULL DEFAULT 0,
    "user_limit" INTEGER,
    "bitrate" INTEGER,
    "permissions" JSONB,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_roles" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "permissions" BIGINT NOT NULL DEFAULT 0,
    "is_hoisted" BOOLEAN NOT NULL DEFAULT false,
    "is_mentionable" BOOLEAN NOT NULL DEFAULT true,
    "is_managed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_roles" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "member_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_members" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3),
    "permissions" BIGINT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 0,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "max_age" INTEGER NOT NULL DEFAULT 0,
    "temporary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_directory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "is_public" BOOLEAN NOT NULL,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "channel_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_servers" (
    "user_id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,
    "roles" JSONB,
    "permissions" JSONB,
    "nickname" TEXT,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_servers_pkey" PRIMARY KEY ("user_id","server_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "servers_invite_code_key" ON "servers"("invite_code");

-- CreateIndex
CREATE INDEX "servers_owner_id_idx" ON "servers"("owner_id");

-- CreateIndex
CREATE INDEX "servers_invite_code_idx" ON "servers"("invite_code");

-- CreateIndex
CREATE INDEX "servers_is_public_created_at_idx" ON "servers"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "server_members_server_id_joined_at_idx" ON "server_members"("server_id", "joined_at");

-- CreateIndex
CREATE INDEX "server_members_user_id_idx" ON "server_members"("user_id");

-- CreateIndex
CREATE INDEX "server_members_roles_idx" ON "server_members"("roles");

-- CreateIndex
CREATE UNIQUE INDEX "server_members_server_id_user_id_key" ON "server_members"("server_id", "user_id");

-- CreateIndex
CREATE INDEX "channels_server_id_position_idx" ON "channels"("server_id", "position");

-- CreateIndex
CREATE INDEX "channels_parent_id_idx" ON "channels"("parent_id");

-- CreateIndex
CREATE INDEX "channels_type_server_id_idx" ON "channels"("type", "server_id");

-- CreateIndex
CREATE INDEX "server_roles_server_id_position_idx" ON "server_roles"("server_id", "position");

-- CreateIndex
CREATE INDEX "server_roles_is_mentionable_server_id_idx" ON "server_roles"("is_mentionable", "server_id");

-- CreateIndex
CREATE UNIQUE INDEX "server_roles_server_id_name_key" ON "server_roles"("server_id", "name");

-- CreateIndex
CREATE INDEX "member_roles_member_id_idx" ON "member_roles"("member_id");

-- CreateIndex
CREATE INDEX "member_roles_role_id_idx" ON "member_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_roles_member_id_role_id_key" ON "member_roles"("member_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_members_channel_id_user_id_key" ON "channel_members"("channel_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");

-- CreateIndex
CREATE INDEX "invites_server_id_created_at_idx" ON "invites"("server_id", "created_at");

-- CreateIndex
CREATE INDEX "invites_creator_id_created_at_idx" ON "invites"("creator_id", "created_at");

-- CreateIndex
CREATE INDEX "invites_expires_at_idx" ON "invites"("expires_at");

-- CreateIndex
CREATE INDEX "invites_expires_at_max_uses_current_uses_idx" ON "invites"("expires_at", "max_uses", "current_uses");

-- CreateIndex
CREATE INDEX "server_directory_is_public_created_at_idx" ON "server_directory"("is_public", "created_at");

-- AddForeignKey
ALTER TABLE "server_members" ADD CONSTRAINT "server_members_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_roles" ADD CONSTRAINT "server_roles_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "server_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "server_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
