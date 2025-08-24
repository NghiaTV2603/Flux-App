-- CreateEnum
CREATE TYPE "public"."ConnectionStatus" AS ENUM ('online', 'offline', 'away', 'busy');

-- CreateEnum
CREATE TYPE "public"."PresenceType" AS ENUM ('user', 'bot');

-- CreateTable
CREATE TABLE "public"."user_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "socket_id" TEXT NOT NULL,
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'online',
    "user_agent" TEXT,
    "ip_address" TEXT,
    "platform" TEXT,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),

    CONSTRAINT "user_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."channel_subscriptions" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read" TIMESTAMP(3),

    CONSTRAINT "channel_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_presence" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'offline',
    "custom_status" TEXT,
    "type" "public"."PresenceType" NOT NULL DEFAULT 'user',
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "active_clients" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."typing_indicators" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "server_id" TEXT,
    "is_typing" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dm_rooms" (
    "id" TEXT NOT NULL,
    "user1_id" TEXT NOT NULL,
    "user2_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."realtime_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "channel_id" TEXT,
    "server_id" TEXT,
    "socket_id" TEXT,
    "payload" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "processing_time" INTEGER,
    "recipient_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "realtime_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."socket_rooms" (
    "id" TEXT NOT NULL,
    "room_name" TEXT NOT NULL,
    "room_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "socket_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connection_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_connections" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,
    "peak_connections" INTEGER NOT NULL DEFAULT 0,
    "avg_connection_time" INTEGER NOT NULL DEFAULT 0,
    "messages_delivered" INTEGER NOT NULL DEFAULT 0,
    "events_failed" INTEGER NOT NULL DEFAULT 0,
    "avg_delivery_time" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_connections_socket_id_key" ON "public"."user_connections"("socket_id");

-- CreateIndex
CREATE INDEX "user_connections_user_id_status_idx" ON "public"."user_connections"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_connections_socket_id_idx" ON "public"."user_connections"("socket_id");

-- CreateIndex
CREATE INDEX "user_connections_last_activity_idx" ON "public"."user_connections"("last_activity");

-- CreateIndex
CREATE INDEX "channel_subscriptions_channel_id_idx" ON "public"."channel_subscriptions"("channel_id");

-- CreateIndex
CREATE INDEX "channel_subscriptions_server_id_idx" ON "public"."channel_subscriptions"("server_id");

-- CreateIndex
CREATE INDEX "channel_subscriptions_user_id_idx" ON "public"."channel_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_subscriptions_connection_id_channel_id_key" ON "public"."channel_subscriptions"("connection_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_presence_user_id_key" ON "public"."user_presence"("user_id");

-- CreateIndex
CREATE INDEX "user_presence_status_is_online_idx" ON "public"."user_presence"("status", "is_online");

-- CreateIndex
CREATE INDEX "user_presence_last_seen_idx" ON "public"."user_presence"("last_seen");

-- CreateIndex
CREATE INDEX "typing_indicators_channel_id_expires_at_idx" ON "public"."typing_indicators"("channel_id", "expires_at");

-- CreateIndex
CREATE INDEX "typing_indicators_expires_at_idx" ON "public"."typing_indicators"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "typing_indicators_user_id_channel_id_key" ON "public"."typing_indicators"("user_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "dm_rooms_room_id_key" ON "public"."dm_rooms"("room_id");

-- CreateIndex
CREATE INDEX "dm_rooms_user1_id_idx" ON "public"."dm_rooms"("user1_id");

-- CreateIndex
CREATE INDEX "dm_rooms_user2_id_idx" ON "public"."dm_rooms"("user2_id");

-- CreateIndex
CREATE INDEX "dm_rooms_room_id_idx" ON "public"."dm_rooms"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "dm_rooms_user1_id_user2_id_key" ON "public"."dm_rooms"("user1_id", "user2_id");

-- CreateIndex
CREATE INDEX "realtime_events_event_type_created_at_idx" ON "public"."realtime_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "realtime_events_user_id_created_at_idx" ON "public"."realtime_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "realtime_events_channel_id_created_at_idx" ON "public"."realtime_events"("channel_id", "created_at");

-- CreateIndex
CREATE INDEX "realtime_events_created_at_idx" ON "public"."realtime_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "socket_rooms_room_name_key" ON "public"."socket_rooms"("room_name");

-- CreateIndex
CREATE INDEX "socket_rooms_room_type_reference_id_idx" ON "public"."socket_rooms"("room_type", "reference_id");

-- CreateIndex
CREATE INDEX "socket_rooms_room_name_idx" ON "public"."socket_rooms"("room_name");

-- CreateIndex
CREATE INDEX "connection_analytics_date_idx" ON "public"."connection_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "connection_analytics_date_key" ON "public"."connection_analytics"("date");

-- AddForeignKey
ALTER TABLE "public"."channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."user_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
