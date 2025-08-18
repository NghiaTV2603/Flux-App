import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsObject,
} from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  @IsIn(['dark', 'light', 'auto'])
  theme?: 'dark' | 'light' | 'auto';

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDirectMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  allowFriendRequests?: boolean;

  @IsOptional()
  @IsObject()
  privacySettings?: any;
}
