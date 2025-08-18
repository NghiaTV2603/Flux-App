import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
} from "class-validator";

export class UpdateServerDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsUrl()
  splashUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxMembers?: number;

  @IsOptional()
  @IsString()
  @IsIn(["none", "low", "medium", "high", "highest"])
  verificationLevel?: "none" | "low" | "medium" | "high" | "highest";

  @IsOptional()
  @IsString()
  @IsIn(["disabled", "members_without_roles", "all_members"])
  contentFilter?: "disabled" | "members_without_roles" | "all_members";
}
