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

export class UpdateItemDto {
  @ApiPropertyOptional({ example: "c2c5c962-d3d0-40e1-bbcb-123456789abc", description: "ID Sub-Kategori" })
  @IsUUID()
  @IsOptional()
  subCategoryId?: string;

  @ApiPropertyOptional({ example: "ThinkPad V14 Gen 4", description: "Nama model/varian barang" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "Lenovo",
    nullable: true,
    description: "Merek barang (kirim kosong/null untuk menghapus merek)",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  brand?: string | null;

  @ApiPropertyOptional({
    example: "82YY001KID / Ultrabook",
    nullable: true,
    description: "Tipe / varian model barang",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  modelType?: string | null;

  @ApiPropertyOptional({ example: "unit", description: "Satuan kuantitas (unit, buah, set, rim, m2)" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({
    example: "Intel Core i5-1335U, RAM 8GB DDR4, SSD 512GB NVMe",
    nullable: true,
    description: "Spesifikasi rinci",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsOptional()
  specifications?: string | null;
}
