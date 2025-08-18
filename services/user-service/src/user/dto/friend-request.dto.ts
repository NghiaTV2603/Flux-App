import { IsString, IsUUID, IsOptional, MaxLength, IsIn } from 'class-validator';

export class SendFriendRequestDto {
  @IsUUID()
  addresseeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}

export class RespondFriendRequestDto {
  @IsUUID()
  friendshipId: string;

  @IsString()
  @IsIn(['accepted', 'declined'])
  response: 'accepted' | 'declined';
}
