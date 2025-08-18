import {
  IsString,
  IsOptional,
  IsIn,
  IsObject,
  IsDateString,
} from 'class-validator';

export class CreateUserActivityDto {
  @IsString()
  @IsIn(['playing', 'listening', 'watching', 'streaming', 'custom'])
  activityType: 'playing' | 'listening' | 'watching' | 'streaming' | 'custom';

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsObject()
  timestamps?: {
    start?: Date;
    end?: Date;
  };

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}

export class UpdateUserActivityDto {
  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsObject()
  timestamps?: {
    start?: Date;
    end?: Date;
  };

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}
