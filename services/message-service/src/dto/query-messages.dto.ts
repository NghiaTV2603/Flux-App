import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  before?: string; // Message ID for pagination

  @IsOptional()
  @IsString()
  after?: string; // Message ID for pagination

  @IsOptional()
  @IsString()
  around?: string; // Message ID to get messages around

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsEnum(['text', 'embed', 'system', 'call', 'file', 'sticker', 'poll'])
  contentType?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasAttachments?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasMentions?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Search in message content
}
