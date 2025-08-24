// RabbitMQ Event Types for Message Service

export interface MessageEventData {
  messageId: string;
  authorId: string;
  channelId?: string;
  conversationId?: string;
  content: string;
  mentions?: any[];
  attachments?: any[];
  messageType: 'channel' | 'direct';
}

export interface MessageEditedEventData {
  messageId: string;
  authorId: string;
  channelId?: string;
  conversationId?: string;
  content: string;
  updatedAt: Date;
}

export interface MessageDeletedEventData {
  messageId: string;
  authorId: string;
  channelId?: string;
  conversationId?: string;
  deletedBy: string;
  deletedAt: Date;
}

export interface ReactionEventData {
  messageId: string;
  userId: string;
  emoji: string;
  channelId?: string;
  conversationId?: string;
}

export interface ThreadEventData {
  threadId: string;
  channelId: string;
  starterId: string;
  title?: string;
  messageId: string;
}

export interface NotificationEventData {
  userId: string;
  type: string;
  referenceId: string;
  referenceType: string;
  content: string;
}

export interface UserProfileUpdateEvent {
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface ChannelDeletedEvent {
  channelId: string;
  serverId: string;
  deletedBy: string;
}

export interface BaseEventMessage {
  timestamp: string;
  version: string;
}

export interface ParsedEventMessage {
  [key: string]: unknown;
}
