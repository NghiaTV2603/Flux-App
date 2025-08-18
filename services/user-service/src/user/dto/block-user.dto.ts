import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class BlockUserDto {
  @IsUUID()
  blockedId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class UnblockUserDto {
  @IsUUID()
  blockedId: string;
}
