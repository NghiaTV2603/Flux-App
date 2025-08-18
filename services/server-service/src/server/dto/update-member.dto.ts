import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsUUID,
} from "class-validator";

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  @MaxLength(32)
  nickname?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  roleIds?: string[];
}

export class AssignRoleDto {
  @IsUUID()
  roleId: string;
}

export class RemoveRoleDto {
  @IsUUID()
  roleId: string;
}
