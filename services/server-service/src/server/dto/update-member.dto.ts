import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @IsString()
  @IsOptional()
  @IsIn(['owner', 'admin', 'member'])
  role?: string;
}
