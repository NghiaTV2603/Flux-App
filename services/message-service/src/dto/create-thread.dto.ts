import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateThreadTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateThreadDto {
  @IsUUID()
  channelId: string;

  @IsUUID()
  messageId: string; // The message that starts the thread

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateThreadTagDto)
  tags?: CreateThreadTagDto[];

  @IsOptional()
  @IsBoolean()
  autoArchive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(60) // Minimum 1 hour
  @Max(10080) // Maximum 1 week
  autoArchiveDuration?: number;

  @IsOptional()
  @IsBoolean()
  requiresInvitation?: boolean;

  // Starter information will be extracted from JWT token
  starterId?: string;
}
