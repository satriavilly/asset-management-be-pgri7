import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { MasterService } from "./master.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { CreateRoomDto } from "./dto/create-room.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Master Data")
@Controller("master")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MasterController {
  constructor(private masterService: MasterService) {}

  @Get("categories")
  @ApiOperation({ summary: "Ambil daftar seluruh kategori utama (A s.d G)" })
  getCategories() {
    return this.masterService.getCategories();
  }

  @Get("sub-categories")
  @ApiOperation({ summary: "Ambil daftar sub-kategori (01 s.d 20)" })
  @ApiQuery({ name: "categoryId", required: false, description: "Filter berdasarkan ID Kategori" })
  getSubCategories(@Query("categoryId") categoryId?: string) {
    return this.masterService.getSubCategories(categoryId);
  }

  @Get("items")
  @ApiOperation({ summary: "Katalog master barang (merek, satuan, spesifikasi)" })
  @ApiQuery({ name: "search", required: false, description: "Cari nama atau merek barang" })
  @ApiQuery({ name: "subCategoryId", required: false, description: "Filter per sub-kategori" })
  getItems(
    @Query("search") search?: string,
    @Query("subCategoryId") subCategoryId?: string,
  ) {
    return this.masterService.getItems(search, subCategoryId);
  }

  @Post("items")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Tambah jenis master barang baru (Admin & Sarpras)" })
  createItem(@Body() dto: CreateItemDto) {
    return this.masterService.createItem(dto);
  }

  @Get("rooms")
  @ApiOperation({ summary: "Daftar ruangan sekolah & Penanggung Jawab Ruangan" })
  getRooms() {
    return this.masterService.getRooms();
  }

  @Post("rooms")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Tambah ruangan baru (Khusus Admin)" })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.masterService.createRoom(dto);
  }

  @Get("funding-sources")
  @ApiOperation({ summary: "Daftar sumber dana / perolehan (Swadaya, BOS, RMP, Hibah)" })
  getFundingSources() {
    return this.masterService.getFundingSources();
  }
}
