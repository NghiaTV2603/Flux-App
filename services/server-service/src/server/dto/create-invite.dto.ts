import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsUUID,
} from "class-validator";

export class CreateInviteDto {
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  maxUses?: number; // 0 = unlimited

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(604800) // Max 7 days in seconds
  maxAge?: number; // 0 = never expires

  @IsOptional()
  @IsBoolean()
  temporary?: boolean;
}
