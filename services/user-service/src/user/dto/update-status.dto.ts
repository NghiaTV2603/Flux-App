import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['online', 'offline', 'busy', 'away', 'invisible'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customStatus?: string;
}
