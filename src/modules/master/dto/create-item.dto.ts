import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateItemDto {
  @ApiProperty({ example: "c2c5c962-d3d0-40e1-bbcb-123456789abc", description: "ID Sub-Kategori" })
  @IsUUID()
  subCategoryId: string;

  @ApiProperty({ example: "ThinkPad V14 Gen 4", description: "Nama model/varian barang" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Lenovo", description: "Merek barang" })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiPropertyOptional({ example: "82YY001KID / Ultrabook", description: "Tipe / varian model barang" })
  @IsString()
  @IsOptional()
  modelType?: string;

  @ApiProperty({ example: "unit", description: "Satuan kuantitas (unit, buah, set, rim)" })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ example: "Intel Core i5-1335U, RAM 8GB DDR4, SSD 512GB NVMe", description: "Spesifikasi rinci" })
  @IsString()
  @IsOptional()
  specifications?: string;
}
