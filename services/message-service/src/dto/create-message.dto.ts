import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttachmentDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsString()
  size: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class CreateMentionDto {
  @IsEnum(['user', 'role', 'everyone', 'channel'])
  type: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  username?: string;
}

export class CreateEmbedDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  fields?: Record<string, any>;
}

export class CreateMessageDto {
  @IsEnum(['channel', 'direct'])
  messageType: string;

  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];

  @IsString()
  @MaxLength(2000, { message: 'Message content cannot exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsEnum(['text', 'embed', 'system', 'call', 'file', 'sticker', 'poll'])
  contentType?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttachmentDto)
  attachments?: CreateAttachmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmbedDto)
  embeds?: CreateEmbedDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stickers?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMentionDto)
  mentions?: CreateMentionDto[];

  @IsOptional()
  @IsUUID()
  replyTo?: string;

  @IsOptional()
  @IsUUID()
  threadId?: string;

  @IsOptional()
  @IsBoolean()
  isTts?: boolean;

  @IsOptional()
  @IsBoolean()
  silent?: boolean;

  // Author information will be extracted from JWT token
  authorId?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}
