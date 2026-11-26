import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const trimNullableString = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
};

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: "LAB-IPA-2", description: "Kode unik ruangan" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Laboratorium IPA 2", description: "Nama ruangan" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "Gedung B", nullable: true, description: "Nama gedung / blok" })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  buildingName?: string | null;

  @ApiPropertyOptional({ example: 2, description: "Tingkat lantai" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({
    example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    nullable: true,
    description: "User ID Guru Penanggung Jawab Ruangan (kirim kosong/null untuk melepas PJ)",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID()
  @IsOptional()
  picUserId?: string | null;
}
