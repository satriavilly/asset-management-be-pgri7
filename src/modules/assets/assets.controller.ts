import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AssetsService } from "./assets.service";
import { UpdateValuationDto } from "./dto/update-valuation.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { AssetCondition, AssetStatus, UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Assets")
@Controller("assets")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: "Ambil daftar seluruh fisik aset dengan filter & pagination" })
  @ApiQuery({ name: "search", required: false, description: "Cari kode, serial no, nama, merek" })
  @ApiQuery({ name: "roomId", required: false, description: "Filter per ruangan" })
  @ApiQuery({ name: "categoryId", required: false, description: "Filter per kategori utama (A-G)" })
  @ApiQuery({ name: "condition", enum: AssetCondition, required: false })
  @ApiQuery({ name: "status", enum: AssetStatus, required: false })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  getAssets(
    @Query("search") search?: string,
    @Query("roomId") roomId?: string,
    @Query("categoryId") categoryId?: string,
    @Query("condition") condition?: AssetCondition,
    @Query("status") status?: AssetStatus,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.assetsService.getAssets({
      search,
      roomId,
      categoryId,
      condition,
      status,
      page,
      limit,
    });
  }

  @Public()
  @Get("code/:inventoryCode")
  @ApiOperation({ summary: "Pencarian publik aset via Kode Inventaris (Hasil Scan QR Kamera)" })
  lookupByCode(@Param("inventoryCode") inventoryCode: string) {
    return this.assetsService.lookupByCode(inventoryCode);
  }

  @Get(":id")
  @ApiOperation({ summary: "Ambil detail lengkap fisik aset, histori servis, mutasi, dan peminjaman" })
  getAssetById(@Param("id") id: string) {
    return this.assetsService.getAssetById(id);
  }

  @Patch(":id/valuation")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Pembaruan manual nilai buku penyusutan aset (Khusus Sarpras)" })
  updateValuation(
    @Param("id") id: string,
    @Body() dto: UpdateValuationDto,
  ) {
    return this.assetsService.updateValuation(id, dto);
  }

  @Get(":id/label")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Ambil payload lengkap untuk cetak stiker label QR ukuran 10 cm x 5 cm" })
  getLabelData(@Param("id") id: string) {
    return this.assetsService.getLabelData(id);
  }
}
