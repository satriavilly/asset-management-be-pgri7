import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

export class UpdateSubCategoryDto {
  @ApiPropertyOptional({ example: "c2c5c962-d3d0-40e1-bbcb-123456789abc", description: "ID Kategori induk" })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: "09", description: "Kode sub-kategori (unik per kategori)" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Kamera CCTV", description: "Nama sub-kategori" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "Perangkat kamera pengawas dan DVR sekolah",
    nullable: true,
    description: "Keterangan / deskripsi sub-kategori",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsOptional()
  description?: string | null;
}
