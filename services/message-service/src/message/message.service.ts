import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Message, MessageDocument } from '../schemas/message.schema';
import {
  MessageReadState,
  MessageReadStateDocument,
} from '../schemas/message-read-state.schema';
import {
  MessageThread,
  MessageThreadDocument,
} from '../schemas/message-thread.schema';
import {
  TypingIndicator,
  TypingIndicatorDocument,
} from '../schemas/typing-indicator.schema';
import {
  ChannelPresence,
  ChannelPresenceDocument,
} from '../schemas/channel-presence.schema';

import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { AddReactionDto } from '../dto/add-reaction.dto';
// import { CreateThreadDto } from '../dto/create-thread.dto';

import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import {
  MessageEventData,
  MessageEditedEventData,
  MessageDeletedEventData,
  ReactionEventData,
} from '../types/rabbitmq.types';
import { UserInfo, QueryFilter, ReactionMap } from '../types/user.types';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(MessageReadState.name)
    private readStateModel: Model<MessageReadStateDocument>,
    @InjectModel(MessageThread.name)
    private threadModel: Model<MessageThreadDocument>,
    @InjectModel(TypingIndicator.name)
    private typingModel: Model<TypingIndicatorDocument>,
    @InjectModel(ChannelPresence.name)
    private presenceModel: Model<ChannelPresenceDocument>,
    private redisService: RedisService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async createMessage(
    createMessageDto: CreateMessageDto,
    userId: string,
    userInfo: UserInfo,
  ): Promise<MessageDocument> {
    // Generate unique message ID
    const messageId = uuidv4();

    // Determine shard key based on message type
    const shardKey =
      createMessageDto.messageType === 'direct'
        ? createMessageDto.conversationId
        : createMessageDto.channelId;

    if (!shardKey) {
      throw new BadRequestException(
        'Either channelId or conversationId must be provided',
      );
    }

    // Get next message number for ordering
    const messageNumber = await this.getNextMessageNumber(shardKey);

    // Create message document
    const messageData = {
      messageId,
      messageType: createMessageDto.messageType,
      channelId: createMessageDto.channelId,
      conversationId: createMessageDto.conversationId,
      participants: createMessageDto.participants,
      authorId: userId,
      authorUsername: userInfo.username,
      authorDisplayName: userInfo.displayName,
      authorAvatarUrl: userInfo.avatarUrl,
      content: createMessageDto.content,
      contentType: createMessageDto.contentType || 'text',
      attachments: createMessageDto.attachments || [],
      embeds: createMessageDto.embeds || [],
      stickers: createMessageDto.stickers || [],
      mentions: createMessageDto.mentions || [],
      reactions: {},
      replyTo: createMessageDto.replyTo,
      threadId: createMessageDto.threadId,
      isThreadStarter: false,
      isEdited: false,
      editHistory: [],
      isDeleted: false,
      isPinned: false,
      isSystem: false,
      isTts: createMessageDto.isTts || false,
      flags: {
        urgent: false,
        crosspost: false,
        ephemeral: false,
        silent: createMessageDto.silent || false,
      },
      shardKey,
      messageNumber,
    };

    const message = new this.messageModel(messageData);
    const savedMessage = await message.save();

    // Update thread message count if this is a thread message
    if (createMessageDto.threadId) {
      await this.updateThreadMessageCount(createMessageDto.threadId);
    }

    // Cache recent messages
    await this.cacheRecentMessage(shardKey, savedMessage);

    // Publish message event
    const messageEventData: MessageEventData = {
      messageId: savedMessage.messageId,
      messageType: savedMessage.messageType as 'channel' | 'direct',
      authorId: savedMessage.authorId,
      channelId: savedMessage.channelId,
      conversationId: savedMessage.conversationId,
      content: savedMessage.content,
      mentions: savedMessage.mentions || [],
      attachments: savedMessage.attachments || [],
    };
    this.rabbitMQService.publishMessageSent(messageEventData);

    // Create notifications for mentions
    if (savedMessage.mentions.length > 0) {
      this.createMentionNotifications(savedMessage);
    }

    return savedMessage;
  }

  async getMessages(
    locationId: string,
    locationKey: 'channelId' | 'conversationId',
    queryDto: QueryMessagesDto,
  ): Promise<MessageDocument[]> {
    // Try cache first for recent messages
    if (!queryDto.before && !queryDto.after && !queryDto.search) {
      const cachedMessages =
        await this.redisService.getRecentMessages(locationId);
      if (cachedMessages) {
        return cachedMessages.slice(0, queryDto.limit) as MessageDocument[];
      }
    }

    // Build query
    const query: QueryFilter = {
      [locationKey]: locationId,
      isDeleted: queryDto.includeDeleted ? { $in: [true, false] } : false,
    };

    // Add filters
    if (queryDto.authorId) query.authorId = queryDto.authorId;
    if (queryDto.contentType) query.contentType = queryDto.contentType;
    if (queryDto.hasAttachments) query['attachments.0'] = { $exists: true };
    if (queryDto.hasMentions) query['mentions.0'] = { $exists: true };
    if (queryDto.isPinned !== undefined) query.isPinned = queryDto.isPinned;

    // Pagination
    if (queryDto.before) {
      const beforeMessage = await this.messageModel.findOne({
        messageId: queryDto.before,
      });
      if (beforeMessage) {
        query.messageNumber = { $lt: beforeMessage.messageNumber };
      }
    }

    if (queryDto.after) {
      const afterMessage = await this.messageModel.findOne({
        messageId: queryDto.after,
      });
      if (afterMessage) {
        query.messageNumber = { $gt: afterMessage.messageNumber };
      }
    }

    // Text search
    if (queryDto.search) {
      query.$text = { $search: queryDto.search };
    }

    const messages = await this.messageModel
      .find(query)
      .sort({ messageNumber: queryDto.after ? 1 : -1 })
      .limit(queryDto.limit || 50)
      .exec();

    return queryDto.after ? messages : messages.reverse();
  }

  async updateMessage(
    messageId: string,
    updateDto: UpdateMessageDto,
    userId: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findOne({
      messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Add to edit history
    const editHistory = {
      content: message.content,
      editedAt: new Date(),
      reason: updateDto.reason,
    };

    const updatedMessage = await this.messageModel.findOneAndUpdate(
      { messageId },
      {
        content: updateDto.content,
        attachments: updateDto.attachments || message.attachments,
        embeds: updateDto.embeds || message.embeds,
        mentions: updateDto.mentions || message.mentions,
        isEdited: true,
        $push: { editHistory },
      },
      { new: true },
    );

    if (!updatedMessage) {
      throw new NotFoundException('Failed to update message');
    }

    // Update cache
    const shardKey = message.channelId || message.conversationId;
    if (shardKey) {
      await this.invalidateMessageCache(shardKey);
    }

    // Publish edit event
    const editEventData: MessageEditedEventData = {
      messageId: updatedMessage.messageId,
      authorId: updatedMessage.authorId,
      channelId: updatedMessage.channelId,
      conversationId: updatedMessage.conversationId,
      content: updatedMessage.content,
      updatedAt: updatedMessage.updatedAt,
    };
    this.rabbitMQService.publishMessageEdited(editEventData);

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findOne({
      messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findOneAndUpdate(
      { messageId },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    );

    // Update cache
    const shardKey = message.channelId || message.conversationId;
    if (shardKey) {
      await this.invalidateMessageCache(shardKey);
    }

    // Publish delete event
    const deleteEventData: MessageDeletedEventData = {
      messageId: message.messageId,
      authorId: message.authorId,
      channelId: message.channelId,
      conversationId: message.conversationId,
      deletedBy: userId,
      deletedAt: new Date(),
    };
    this.rabbitMQService.publishMessageDeleted(deleteEventData);
  }

  async addReaction(
    messageId: string,
    reactionDto: AddReactionDto,
    userId: string,
  ): Promise<void> {
    const message = await this.messageModel.findOne({
      messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const emoji = reactionDto.emoji;
    const reactions = (message.reactions as ReactionMap) || {};

    if (reactions[emoji]) {
      const reaction = reactions[emoji];
      if (reaction && !reaction.users.includes(userId)) {
        reaction.users.push(userId);
        reaction.count = reaction.users.length;
      }
    } else {
      reactions[emoji] = {
        emoji,
        count: 1,
        users: [userId],
        emojiId: reactionDto.emojiId,
        animated: reactionDto.animated || false,
      };
    }

    await this.messageModel.findOneAndUpdate({ messageId }, { reactions });

    // Publish reaction event
    const reactionEventData: ReactionEventData = {
      messageId,
      userId,
      emoji,
      channelId: message.channelId,
      conversationId: message.conversationId,
    };
    this.rabbitMQService.publishReactionAdded(reactionEventData);
  }

  async removeReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const message = await this.messageModel.findOne({
      messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reactions = (message.reactions as ReactionMap) || {};

    if (reactions[emoji]) {
      const reaction = reactions[emoji];
      if (reaction) {
        const userIndex = reaction.users.indexOf(userId);

        if (userIndex > -1) {
          reaction.users.splice(userIndex, 1);
          reaction.count = reaction.users.length;

          if (reaction.count === 0) {
            delete reactions[emoji];
          }
        }
      }
    }

    await this.messageModel.findOneAndUpdate({ messageId }, { reactions });

    // Publish reaction removed event
    const reactionEventData: ReactionEventData = {
      messageId,
      userId,
      emoji,
      channelId: message.channelId,
      conversationId: message.conversationId,
    };
    this.rabbitMQService.publishReactionRemoved(reactionEventData);
  }

  // Helper methods
  private async getNextMessageNumber(shardKey: string): Promise<number> {
    const lastMessage = await this.messageModel
      .findOne({ shardKey })
      .sort({ messageNumber: -1 })
      .exec();

    return lastMessage ? lastMessage.messageNumber + 1 : 1;
  }

  private async cacheRecentMessage(
    shardKey: string,
    message: MessageDocument,
  ): Promise<void> {
    const cached = (await this.redisService.getRecentMessages(shardKey)) || [];
    cached.unshift(message);

    // Keep only 50 recent messages
    if (cached.length > 50) {
      cached.splice(50);
    }

    await this.redisService.cacheRecentMessages(shardKey, cached);
  }

  private async invalidateMessageCache(shardKey: string): Promise<void> {
    await this.redisService.del(`messages:recent:${shardKey}`);
  }

  private async updateThreadMessageCount(threadId: string): Promise<void> {
    await this.threadModel.findOneAndUpdate(
      { threadId },
      {
        $inc: { messageCount: 1 },
        lastMessageAt: new Date(),
      },
    );
  }

  private createMentionNotifications(message: MessageDocument): void {
    for (const mention of message.mentions) {
      if (mention.type === 'user') {
        this.rabbitMQService.publishNotificationCreated({
          userId: mention.id,
          type: 'mention',
          referenceId: message.messageId,
          referenceType: 'message',
          content: `You were mentioned by ${message.authorUsername}`,
        });
      }
    }
  }
}
