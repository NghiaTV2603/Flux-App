import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

// Embedded schemas
@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  type: string;

  @Prop()
  thumbnail?: string;
}

@Schema({ _id: false })
export class Embed {
  @Prop({ required: true })
  type: string;

  @Prop()
  title?: string;

  @Prop()
  description?: string;

  @Prop()
  url?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ type: Object })
  fields?: Record<string, any>;
}

@Schema({ _id: false })
export class Mention {
  @Prop({ required: true, enum: ['user', 'role', 'everyone', 'channel'] })
  type: string;

  @Prop({ required: true })
  id: string;

  @Prop()
  username?: string;
}

@Schema({ _id: false })
export class Reaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ required: true, default: 0 })
  count: number;

  @Prop({ type: [String], default: [] })
  users: string[];

  @Prop()
  emojiId?: string;

  @Prop({ default: false })
  animated: boolean;
}

@Schema({ _id: false })
export class EditHistory {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: Date.now })
  editedAt: Date;

  @Prop()
  reason?: string;
}

@Schema({ _id: false })
export class PollOption {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  votes: string[];
}

@Schema({ _id: false })
export class Poll {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [PollOption], default: [] })
  options: PollOption[];

  @Prop()
  expiresAt?: Date;
}

@Schema({ _id: false })
export class CallData {
  @Prop({ required: true, enum: ['voice', 'video'] })
  type: string;

  @Prop()
  duration?: number;

  @Prop({ type: [String], default: [] })
  participants: string[];

  @Prop()
  endedTimestamp?: Date;
}

@Schema({ _id: false })
export class MessageFlags {
  @Prop({ default: false })
  urgent: boolean;

  @Prop({ default: false })
  crosspost: boolean;

  @Prop({ default: false })
  ephemeral: boolean;

  @Prop({ default: false })
  silent: boolean;
}

@Schema({
  collection: 'messages',
  timestamps: true,
  shardKey: { shardKey: 1 },
})
export class Message {
  @Prop({ required: true, unique: true })
  messageId: string;

  @Prop({
    required: true,
    enum: ['channel', 'direct', 'system', 'voice_call', 'screen_share'],
    index: true,
  })
  messageType: string;

  // Channel Messages Fields
  @Prop({ index: true })
  channelId?: string;

  @Prop({ index: true })
  serverId?: string;

  // Direct Messages Fields
  @Prop({ index: true })
  conversationId?: string;

  @Prop({ type: [String] })
  participants?: string[];

  // Author Information (denormalized)
  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ required: true })
  authorUsername: string;

  @Prop()
  authorDisplayName?: string;

  @Prop()
  authorAvatarUrl?: string;

  // Message Content
  @Prop({ required: true })
  content: string;

  @Prop({
    required: true,
    enum: ['text', 'embed', 'system', 'call', 'file', 'sticker', 'poll'],
    default: 'text',
  })
  contentType: string;

  // Rich Content
  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];

  @Prop({ type: [Embed], default: [] })
  embeds: Embed[];

  @Prop({ type: [String], default: [] })
  stickers: string[];

  @Prop({ type: Poll })
  poll?: Poll;

  // Social Features
  @Prop({ type: [Mention], default: [] })
  mentions: Mention[];

  @Prop({ type: Object, default: {} })
  reactions: Record<string, any>;

  // Threading & Replies
  @Prop({ index: true })
  replyTo?: string;

  @Prop({ index: true })
  threadId?: string;

  @Prop({ default: false })
  isThreadStarter: boolean;

  // Message State
  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ type: [EditHistory], default: [] })
  editHistory: EditHistory[];

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  deletedBy?: string;

  // Special Flags
  @Prop({ default: false, index: true })
  isPinned: boolean;

  @Prop()
  pinnedBy?: string;

  @Prop()
  pinnedAt?: Date;

  @Prop({ default: false })
  isSystem: boolean;

  @Prop({ default: false })
  isTts: boolean;

  @Prop({ type: MessageFlags, default: () => ({}) })
  flags: MessageFlags;

  // Voice/Video Call Data
  @Prop({ type: CallData })
  callData?: CallData;

  // Sharding & Performance
  @Prop({ required: true, index: true })
  shardKey: string;

  @Prop({ required: true })
  messageNumber: number;

  // Timestamps (handled by timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for performance
MessageSchema.index({ messageType: 1, shardKey: 1, createdAt: -1 });
MessageSchema.index({ channelId: 1, messageNumber: -1, _id: 1 });
MessageSchema.index({ conversationId: 1, messageNumber: -1, _id: 1 });
MessageSchema.index({ threadId: 1, createdAt: 1, messageNumber: 1 });
MessageSchema.index({ authorId: 1, createdAt: -1 });
MessageSchema.index({ 'mentions.id': 1, 'mentions.type': 1, createdAt: -1 });
MessageSchema.index({ isPinned: 1, channelId: 1, pinnedAt: -1 });
MessageSchema.index({ replyTo: 1, createdAt: 1 });
MessageSchema.index({ contentType: 1, messageType: 1, createdAt: -1 });
MessageSchema.index({ isDeleted: 1, deletedAt: 1 });

// Text search index
MessageSchema.index({
  content: 'text',
  authorUsername: 'text',
  'attachments.name': 'text',
});
