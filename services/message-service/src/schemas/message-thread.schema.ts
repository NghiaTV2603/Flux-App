import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageThreadDocument = MessageThread & Document;

@Schema({ _id: false })
export class ThreadTag {
  @Prop({ required: true })
  name: string;

  @Prop()
  color?: string;
}

@Schema({ _id: false })
export class ThreadParticipant {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, default: Date.now })
  joinedAt: Date;

  @Prop()
  lastReadAt?: Date;
}

@Schema({
  collection: 'message_threads',
  timestamps: true,
  shardKey: { channelId: 1 },
})
export class MessageThread {
  @Prop({ required: true, unique: true, index: true })
  threadId: string;

  @Prop({ required: true, index: true })
  channelId: string;

  @Prop({ index: true })
  serverId?: string;

  // Thread Metadata
  @Prop()
  title?: string;

  @Prop()
  description?: string;

  @Prop({ type: [ThreadTag], default: [] })
  tags: ThreadTag[];

  // Thread State
  @Prop({
    required: true,
    enum: ['active', 'archived', 'locked', 'deleted'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ default: false, index: true })
  isPinned: boolean;

  @Prop({ default: true })
  autoArchive: boolean;

  @Prop({ default: 1440 }) // 24 hours in minutes
  autoArchiveDuration: number;

  // Participants & Activity
  @Prop({ required: true, index: true })
  starterId: string;

  @Prop({ type: [ThreadParticipant], default: [] })
  participants: ThreadParticipant[];

  @Prop({ default: 0 })
  messageCount: number;

  @Prop({ default: 0 })
  memberCount: number;

  // Thread Settings
  @Prop({ default: false })
  slowMode: boolean;

  @Prop({ default: 0 })
  slowModeDelay: number;

  @Prop({ default: false })
  requiresInvitation: boolean;

  // Timestamps
  @Prop({ default: Date.now, index: true })
  lastMessageAt: Date;

  @Prop()
  archivedAt?: Date;

  @Prop()
  archivedBy?: string;

  // Sharding key
  @Prop({ required: true, index: true })
  shardKey: string;

  // Timestamps (handled by timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const MessageThreadSchema = SchemaFactory.createForClass(MessageThread);

// Indexes for performance
MessageThreadSchema.index({ channelId: 1, status: 1, lastMessageAt: -1 });
MessageThreadSchema.index({ channelId: 1, isPinned: 1, createdAt: -1 });
MessageThreadSchema.index({
  'participants.userId': 1,
  'participants.lastReadAt': -1,
});
MessageThreadSchema.index({ starterId: 1, createdAt: -1 });
MessageThreadSchema.index({ status: 1, archivedAt: -1 });
MessageThreadSchema.index({ autoArchive: 1, lastMessageAt: 1 });
MessageThreadSchema.index({ messageCount: -1, memberCount: -1 });

// Text search for title and description
MessageThreadSchema.index({
  title: 'text',
  description: 'text',
});
