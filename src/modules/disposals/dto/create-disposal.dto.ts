import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DisposalMethod, DisposalReason } from "@prisma/client";

export class CreateDisposalDto {
  @ApiProperty({ example: "BAST-HAPUS/2026/XI/001", description: "Nomor resmi Berita Acara Pemusnahan Aset" })
  @IsString()
  @IsNotEmpty()
  disposalNo: string;

  @ApiProperty({ description: "ID AssetItem yang akan dimusnahkan/dihapus" })
  @IsUUID()
  assetItemId: string;

  @ApiProperty({ example: "2026-11-10", description: "Tanggal eksekusi pemusnahan fisik (YYYY-MM-DD)" })
  @IsDateString()
  disposalDate: string;

  @ApiProperty({ enum: DisposalMethod, example: DisposalMethod.SCRAP_DESTROY })
  @IsEnum(DisposalMethod)
  disposalMethod: DisposalMethod;

  @ApiProperty({ enum: DisposalReason, example: DisposalReason.DAMAGED_BEYOND_REPAIR })
  @IsEnum(DisposalReason)
  reason: DisposalReason;

  @ApiProperty({ example: "Drs. Maman Sutarman", description: "Nama Saksi 1 (Wakil Kepala Sekolah / Guru Senior)" })
  @IsString()
  @IsNotEmpty()
  witness1Name: string;

  @ApiProperty({ example: "Wakil Kepala Sekolah Bidang Kurikulum", description: "Jabatan Saksi 1" })
  @IsString()
  @IsNotEmpty()
  witness1Role: string;

  @ApiProperty({ example: "Hj. Endang Rahayu", description: "Nama Saksi 2 (Staf Tata Usaha / Perwakilan Komite)" })
  @IsString()
  @IsNotEmpty()
  witness2Name: string;

  @ApiProperty({ example: "Kepala Tata Usaha SMP PGRI 7", description: "Jabatan Saksi 2" })
  @IsString()
  @IsNotEmpty()
  witness2Role: string;

  @ApiProperty({ example: "https://aset.smppgri7bdg.sch.id/uploads/disposal/bast_doc_001.pdf", description: "URL scan dokumen BAST bertanda tangan & foto pemusnahan" })
  @IsString()
  @IsNotEmpty()
  evidenceDocUrl: string;
}
