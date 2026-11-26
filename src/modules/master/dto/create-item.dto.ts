import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return value;
};

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateItemDto {
  @ApiProperty({ example: "c2c5c962-d3d0-40e1-bbcb-123456789abc", description: "ID Sub-Kategori" })
  @IsUUID()
  subCategoryId: string;

  @ApiProperty({ example: "ThinkPad V14 Gen 4", description: "Nama model/varian barang" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: "Lenovo",
    description: "Merek barang (opsional, dapat dikosongkan untuk Tanah/Bangunan atau ATK tanpa merek)",
  })
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: "82YY001KID / Ultrabook", description: "Tipe / varian model barang" })
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  modelType?: string;

  @ApiProperty({ example: "unit", description: "Satuan kuantitas (unit, buah, set, rim, m2)" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit: string;

  @ApiPropertyOptional({
    example: "Intel Core i5-1335U, RAM 8GB DDR4, SSD 512GB NVMe",
    description: "Spesifikasi rinci",
  })
  @Transform(trimOrUndefined)
  @IsString()
  @IsOptional()
  specifications?: string;
}
