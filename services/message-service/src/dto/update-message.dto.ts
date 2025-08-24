import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateAttachmentDto,
  CreateEmbedDto,
  CreateMentionDto,
} from './create-message.dto';

export class UpdateMessageDto {
  @IsString()
  @MaxLength(2000, { message: 'Message content cannot exceed 2000 characters' })
  content: string;

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
  @ValidateNested({ each: true })
  @Type(() => CreateMentionDto)
  mentions?: CreateMentionDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
