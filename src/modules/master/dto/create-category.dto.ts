import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

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

export class CreateCategoryDto {
  @ApiProperty({ example: "H", description: "Kode unik kategori (maksimal 5 karakter)" })
  @Transform(trimUpper)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  code: string;

  @ApiProperty({ example: "Perlengkapan Laboratorium", description: "Nama kategori aset" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: "Peralatan praktikum dan penunjang laboratorium sekolah",
    description: "Keterangan / deskripsi kategori",
  })
  @Transform(trimOrUndefined)
  @IsString()
  @IsOptional()
  description?: string;
}
