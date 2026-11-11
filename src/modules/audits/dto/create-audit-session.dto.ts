import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AssetCondition } from "@prisma/client";

export class CreateAuditSessionDto {
  @ApiProperty({ example: "Audit Fisik Semester Ganjil 2026/2027", description: "Nama sesi stock opname" })
  @IsString()
  @IsNotEmpty()
  sessionName: string;

  @ApiProperty({ example: 2026, description: "Tahun periode audit" })
  @IsInt()
  @Min(2020)
  auditYear: number;

  @ApiProperty({ example: "2026-11-10", description: "Tanggal mulai pelaksanaan audit (YYYY-MM-DD)" })
  @IsDateString()
  startDate: string;
}

export class ScanAuditItemDto {
  @ApiProperty({ description: "ID AssetItem yang di-scan atau Kode Inventaris" })
  @IsString()
  @IsNotEmpty()
  assetIdentifier: string; // can be UUID or inventoryCode

  @ApiProperty({ description: "ID Ruangan tempat auditor sedang berdiri/memindai" })
  @IsUUID()
  scannedRoomId: string;

  @ApiProperty({ enum: AssetCondition, example: AssetCondition.GOOD })
  @IsEnum(AssetCondition)
  physicalCondition: AssetCondition;
}
