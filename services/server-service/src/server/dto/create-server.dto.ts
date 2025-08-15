import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
