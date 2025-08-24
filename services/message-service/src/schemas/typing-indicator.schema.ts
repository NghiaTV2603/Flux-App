import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TypingIndicatorDocument = TypingIndicator & Document;

@Schema({
  collection: 'typing_indicators',
  timestamps: { createdAt: false, updatedAt: false },
  expireAfterSeconds: 10, // TTL: 10 seconds
})
export class TypingIndicator {
  // Location Context
  @Prop({ index: true })
  channelId?: string;

  @Prop({ index: true })
  conversationId?: string;

  @Prop({ index: true })
  threadId?: string;

  // User Information (denormalized)
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop()
  avatarUrl?: string;

  // Typing State
  @Prop({
    required: true,
    enum: ['text', 'upload', 'voice_message'],
    default: 'text',
  })
  typingType: string;

  @Prop({ required: true, default: Date.now })
  startedAt: Date;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  // TTL for auto-cleanup
  @Prop({ default: 10 })
  ttlSeconds: number;
}

export const TypingIndicatorSchema =
  SchemaFactory.createForClass(TypingIndicator);

// Indexes for real-time queries
TypingIndicatorSchema.index({ channelId: 1, conversationId: 1, expiresAt: 1 });
TypingIndicatorSchema.index({ userId: 1, startedAt: -1 });
TypingIndicatorSchema.index({ threadId: 1, expiresAt: 1 });

// TTL index for auto-cleanup
TypingIndicatorSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
