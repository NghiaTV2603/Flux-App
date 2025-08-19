import { IsString, IsOptional, IsArray, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ServerPermission } from '../enums/permissions.enum';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  position?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ServerPermission, { each: true })
  permissions?: ServerPermission[];

  @IsOptional()
  @IsBoolean()
  isHoisted?: boolean;

  @IsOptional()
  @IsBoolean()
  isMentionable?: boolean;
}
