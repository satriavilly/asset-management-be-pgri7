import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

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

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "H", description: "Kode unik kategori (maksimal 5 karakter)" })
  @Transform(trimUpper)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Perlengkapan Laboratorium", description: "Nama kategori aset" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "Peralatan praktikum dan penunjang laboratorium sekolah",
    nullable: true,
    description: "Keterangan / deskripsi kategori",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsOptional()
  description?: string | null;
}
