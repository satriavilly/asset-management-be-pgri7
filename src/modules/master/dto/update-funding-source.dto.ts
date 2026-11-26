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

export class UpdateFundingSourceDto {
  @ApiPropertyOptional({ example: "DAK", description: "Kode unik sumber dana (maksimal 20 karakter)" })
  @Transform(trimUpper)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Dana Alokasi Khusus", description: "Nama sumber dana / perolehan" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "Bantuan DAK fisik pendidikan dari pemerintah daerah/pusat",
    nullable: true,
    description: "Keterangan / deskripsi sumber dana",
  })
  @Transform(trimNullableString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsOptional()
  description?: string | null;
}
