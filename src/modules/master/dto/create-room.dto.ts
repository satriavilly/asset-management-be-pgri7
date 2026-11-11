import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRoomDto {
  @ApiProperty({ example: "LAB-IPA-2", description: "Kode unik ruangan" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Laboratorium IPA 2", description: "Nama ruangan" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "Gedung B", description: "Nama gedung / blok" })
  @IsString()
  @IsOptional()
  buildingName?: string;

  @ApiPropertyOptional({ example: 2, description: "Tingkat lantai", default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: "User ID Guru Penanggung Jawab Ruangan" })
  @IsUUID()
  @IsOptional()
  picUserId?: string;
}
