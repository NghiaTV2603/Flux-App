import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AddReactionDto {
  @IsString()
  emoji: string;

  @IsOptional()
  @IsString()
  emojiId?: string;

  @IsOptional()
  @IsBoolean()
  animated?: boolean;
}
