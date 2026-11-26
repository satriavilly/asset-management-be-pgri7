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

export class CreateFundingSourceDto {
  @ApiProperty({ example: "DAK", description: "Kode unik sumber dana (maksimal 20 karakter)" })
  @Transform(trimUpper)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: "Dana Alokasi Khusus", description: "Nama sumber dana / perolehan" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: "Bantuan DAK fisik pendidikan dari pemerintah daerah/pusat",
    description: "Keterangan / deskripsi sumber dana",
  })
  @Transform(trimOrUndefined)
  @IsString()
  @IsOptional()
  description?: string;
}
