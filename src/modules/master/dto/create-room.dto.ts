import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return value;
};

export class CreateRoomDto {
  @ApiProperty({ example: "LAB-IPA-2", description: "Kode unik ruangan" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: "Laboratorium IPA 2", description: "Nama ruangan" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: "Gedung B", description: "Nama gedung / blok" })
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  buildingName?: string;

  @ApiPropertyOptional({ example: 2, description: "Tingkat lantai", default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: "User ID Guru Penanggung Jawab Ruangan" })
  @Transform(trimOrUndefined)
  @IsUUID()
  @IsOptional()
  picUserId?: string;
}
