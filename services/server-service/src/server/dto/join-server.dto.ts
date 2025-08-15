import { IsString, IsNotEmpty } from 'class-validator';

export class JoinServerDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
