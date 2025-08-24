import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChannelPresenceDocument = ChannelPresence & Document;

@Schema({
  collection: 'channel_presence',
  timestamps: { createdAt: false, updatedAt: false },
  expireAfterSeconds: 300, // TTL: 5 minutes
  shardKey: { channelId: 1 },
})
export class ChannelPresence {
  @Prop({ required: true, index: true })
  channelId: string;

  @Prop({ required: true, index: true })
  userId: string;

  // Presence Information (denormalized)
  @Prop({ required: true })
  username: string;

  @Prop()
  avatarUrl?: string;

  @Prop({
    required: true,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'online',
    index: true,
  })
  status: string;

  // Activity Tracking
  @Prop({ required: true, default: Date.now })
  joinedAt: Date;

  @Prop({ required: true, default: Date.now, index: true })
  lastActivity: Date;

  @Prop({ required: true, default: Date.now, index: true })
  heartbeat: Date;

  // TTL for inactive users
  @Prop({ default: 300 })
  ttlSeconds: number;
}

export const ChannelPresenceSchema =
  SchemaFactory.createForClass(ChannelPresence);

// Indexes for presence tracking
ChannelPresenceSchema.index({ channelId: 1, status: 1, lastActivity: -1 });
ChannelPresenceSchema.index({ userId: 1, heartbeat: -1 });
ChannelPresenceSchema.index({ status: 1, lastActivity: -1 });

// TTL index for auto-cleanup
ChannelPresenceSchema.index({ heartbeat: 1 }, { expireAfterSeconds: 300 });

// Unique constraint: one presence record per user per channel
ChannelPresenceSchema.index({ channelId: 1, userId: 1 }, { unique: true });
