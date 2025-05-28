import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['online', 'offline', 'invisible', 'busy'])
  status: string;
}
