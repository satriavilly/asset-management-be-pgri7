import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMutationDto {
  @ApiProperty({ example: "MUT/2026/XI/001", description: "Nomor Berita Acara Mutasi" })
  @IsString()
  @IsNotEmpty()
  mutationNo: string;

  @ApiProperty({ description: "ID AssetItem yang akan dipindahkan" })
  @IsUUID()
  assetItemId: string;

  @ApiProperty({ description: "ID Ruangan tujuan pemindahan" })
  @IsUUID()
  toRoomId: string;

  @ApiProperty({ example: "Kebutuhan proyektor tambahan untuk ruang Lab Bahasa", description: "Alasan mutasi aset" })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
