import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageReadStateDocument = MessageReadState & Document;

@Schema({ _id: false })
export class ChannelReadState {
  @Prop({ required: true })
  lastMessageId: string;

  @Prop({ required: true, default: Date.now })
  lastReadAt: Date;

  @Prop({ default: 0 })
  mentionCount: number;

  @Prop({ default: 0 })
  unreadCount: number;
}

@Schema({ _id: false })
export class ConversationReadState {
  @Prop({ required: true })
  lastMessageId: string;

  @Prop({ required: true, default: Date.now })
  lastReadAt: Date;

  @Prop({ default: 0 })
  unreadCount: number;
}

@Schema({ _id: false })
export class MessageReceipt {
  @Prop({ required: true })
  messageId: string;

  @Prop({ required: true, default: Date.now })
  readAt: Date;

  @Prop({ default: false })
  isMentioned: boolean;
}

@Schema({
  collection: 'message_read_states',
  timestamps: { createdAt: false, updatedAt: true },
  shardKey: { userId: 1 },
})
export class MessageReadState {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  // Channel Read States (embedded document per channel)
  @Prop({
    type: Object,
    default: {},
  })
  channelReads: Record<string, any>;

  // DM Read States (embedded document per conversation)
  @Prop({
    type: Object,
    default: {},
  })
  conversationReads: Record<string, any>;

  // Individual Message Read Receipts (for important messages only)
  @Prop({ type: [MessageReceipt], default: [] })
  messageReceipts: MessageReceipt[];

  // Sharding key
  @Prop({ required: true, index: true })
  shardKey: string;

  // Timestamp
  updatedAt: Date;
}

export const MessageReadStateSchema =
  SchemaFactory.createForClass(MessageReadState);

// Indexes for performance
MessageReadStateSchema.index({ userId: 1, channelReads: 1 });
MessageReadStateSchema.index({ userId: 1, conversationReads: 1 });
MessageReadStateSchema.index({ userId: 1, 'messageReceipts.readAt': -1 });
MessageReadStateSchema.index({ 'messageReceipts.messageId': 1 });
