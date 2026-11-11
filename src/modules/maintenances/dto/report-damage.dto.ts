import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MaintenanceType } from "@prisma/client";

export class ReportDamageDto {
  @ApiProperty({ description: "ID AssetItem yang mengalami kerusakan" })
  @IsUUID()
  assetItemId: string;

  @ApiProperty({ example: "Layar monitor berkedip dan mati total saat dinyalakan", description: "Uraian gejala kerusakan" })
  @IsString()
  @IsNotEmpty()
  damageDescription: string;

  @ApiProperty({ example: "https://aset.smppgri7bdg.sch.id/uploads/damage/img_01.jpg", description: "URL foto bukti kerusakan dari kamera HP" })
  @IsString()
  @IsNotEmpty()
  damagePhotoUrl: string;
}

export class TriageMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.SELF })
  @IsEnum(MaintenanceType)
  maintenanceType: MaintenanceType;

  @ApiPropertyOptional({ example: "CV. Citra Komputer Bandung", description: "Nama vendor/bengkel servis" })
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiPropertyOptional({ example: 350000, description: "Estimasi / realisasi biaya perbaikan (Rp)" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: false, description: "Tandai jika kerusakan parah dan dialihkan ke pemusnahan aset" })
  @IsOptional()
  escalateToDisposal?: boolean;
}
