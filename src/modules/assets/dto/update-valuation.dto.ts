import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateValuationDto {
  @ApiProperty({ example: 4500000, description: "Nilai buku aktual barang terkini (diinput manual)" })
  @IsNumber()
  @Min(0)
  currentValue: number;

  @ApiPropertyOptional({ example: "Penurunan nilai fisik pasca-servis engsel layar", description: "Alasan penyesuaian nilai" })
  @IsString()
  @IsOptional()
  notes?: string;
}
