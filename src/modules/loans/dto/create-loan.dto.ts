import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BorrowerType } from "@prisma/client";

export class CreateLoanDto {
  @ApiProperty({ example: "LOAN/2026/XI/001", description: "Nomor registrasi peminjaman" })
  @IsString()
  @IsNotEmpty()
  loanNo: string;

  @ApiProperty({ enum: BorrowerType, example: BorrowerType.INTERNAL })
  @IsEnum(BorrowerType)
  borrowerType: BorrowerType;

  @ApiPropertyOptional({ description: "ID User jika peminjam adalah guru/staf internal" })
  @IsUUID()
  @IsOptional()
  borrowerUserId?: string;

  @ApiProperty({ example: "Drs. Ahmad Hidayat", description: "Nama lengkap peminjam" })
  @IsString()
  @IsNotEmpty()
  borrowerName: string;

  @ApiProperty({ example: "081234567890", description: "Nomor WhatsApp aktif peminjam" })
  @IsString()
  @IsNotEmpty()
  borrowerPhone: string;

  @ApiPropertyOptional({ example: "3273123456780001", description: "NIK/KTP jika peminjam pihak luar" })
  @IsString()
  @IsOptional()
  borrowerIdCard?: string;

  @ApiProperty({ example: "2026-11-15", description: "Tanggal mulai pinjam (YYYY-MM-DD)" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: "2026-11-17", description: "Rencana tanggal pengembalian (YYYY-MM-DD)" })
  @IsDateString()
  expectedReturnDate: string;

  @ApiProperty({ example: "Kegiatan Pelatihan Guru Matematika se-Kecamatan", description: "Keperluan peminjaman" })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ type: [String], description: "Daftar ID fisik AssetItem yang dipinjam" })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  assetItemIds: string[];
}

export class ReturnLoanDto {
  @ApiPropertyOptional({ example: "Ada lecet pada bodi belakang proyektor", description: "Catatan sanksi atau denda ganti rugi" })
  @IsString()
  @IsOptional()
  penaltyNotes?: string;

  @ApiPropertyOptional({ description: "Rincian kondisi fisik saat dikembalikan per asset_item_id" })
  @IsOptional()
  itemConditions?: { assetItemId: string; conditionAfter: any }[];
}
