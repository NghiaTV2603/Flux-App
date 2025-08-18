import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsInt,
  Min,
  IsHexColor,
} from "class-validator";

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  permissions?: string; // BigInt as string

  @IsOptional()
  @IsBoolean()
  isHoisted?: boolean;

  @IsOptional()
  @IsBoolean()
  isMentionable?: boolean;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  permissions?: string; // BigInt as string

  @IsOptional()
  @IsBoolean()
  isHoisted?: boolean;

  @IsOptional()
  @IsBoolean()
  isMentionable?: boolean;
}
