import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProcurementItemInputDto {
  @ApiProperty({ description: "ID Master Barang" })
  @IsUUID()
  itemId: string;

  @ApiProperty({ example: 10, description: "Jumlah unit barang yang dibeli" })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 7500000, description: "Harga perolehan satuan (Rp)" })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: "LAB-KOMP-1", description: "ID Ruangan penempatan awal fisik barang" })
  @IsUUID()
  targetRoomId: string;

  @ApiPropertyOptional({ type: [String], example: ["SN-2026-001", "SN-2026-002"], description: "Daftar nomor seri masing-masing unit aset" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serialNumbers?: string[];

  @ApiPropertyOptional({ example: "https://aset.smppgri7bdg.sch.id/uploads/assets/laptop-01.jpg", description: "URL foto fisik barang" })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class CreateProcurementDto {
  @ApiProperty({ example: "PROC/2026/XI/001", description: "Nomor faktur / referensi pengadaan" })
  @IsString()
  @IsNotEmpty()
  procurementNo: string;

  @ApiProperty({ description: "ID Sumber Dana (BOS, RMP, Swadaya, Hibah)" })
  @IsUUID()
  fundingSourceId: string;

  @ApiProperty({ example: "2026-11-10", description: "Tanggal realisasi pengadaan (YYYY-MM-DD)" })
  @IsDateString()
  procurementDate: string;

  @ApiPropertyOptional({ example: "BAST/2026/042", description: "Nomor Berita Acara Serah Terima" })
  @IsString()
  @IsOptional()
  receiptBastNo?: string;

  @ApiProperty({ type: [ProcurementItemInputDto], description: "Daftar rincian item pengadaan" })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProcurementItemInputDto)
  items: ProcurementItemInputDto[];
}
