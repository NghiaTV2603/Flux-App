import { IsString, IsOptional, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  isNsfw?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  slowmodeDelay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(8000)
  bitrate?: number;
}
