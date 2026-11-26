import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
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

export class CreateSubCategoryDto {
  @ApiProperty({ example: "c2c5c962-d3d0-40e1-bbcb-123456789abc", description: "ID Kategori induk" })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: "09", description: "Kode sub-kategori (unik per kategori, misal 01, 02)" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  code: string;

  @ApiProperty({ example: "Kamera CCTV", description: "Nama sub-kategori" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: "Perangkat kamera pengawas dan DVR sekolah",
    description: "Keterangan / deskripsi sub-kategori",
  })
  @Transform(trimOrUndefined)
  @IsString()
  @IsOptional()
  description?: string;
}
