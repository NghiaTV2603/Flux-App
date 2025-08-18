import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsUUID,
} from "class-validator";

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  topic?: string;

  @IsString()
  @IsIn(["text", "voice", "category", "announcement", "stage", "forum"])
  type: "text" | "voice" | "category" | "announcement" | "stage" | "forum";

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  isNsfw?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(21600) // Max 6 hours
  slowmodeDelay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  userLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(8000)
  @Max(384000)
  bitrate?: number;
}
