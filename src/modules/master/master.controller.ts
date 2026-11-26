import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { MasterService } from "./master.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateSubCategoryDto } from "./dto/create-sub-category.dto";
import { UpdateSubCategoryDto } from "./dto/update-sub-category.dto";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { CreateFundingSourceDto } from "./dto/create-funding-source.dto";
import { UpdateFundingSourceDto } from "./dto/update-funding-source.dto";
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

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  @Get("categories")
  @ApiOperation({ summary: "Ambil daftar seluruh kategori utama (A s.d G)" })
  getCategories() {
    return this.masterService.getCategories();
  }

  @Post("categories")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Tambah kategori aset baru (Admin & Sarpras)" })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.masterService.createCategory(dto);
  }

  @Patch("categories/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Kategori" })
  @ApiOperation({ summary: "Ubah data kategori aset (Admin & Sarpras)" })
  updateCategory(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.masterService.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Kategori" })
  @ApiOperation({ summary: "Hapus kategori aset (ditolak bila masih memiliki sub-kategori)" })
  deleteCategory(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterService.deleteCategory(id);
  }

  // -------------------------------------------------------------
  // SUB-CATEGORIES
  // -------------------------------------------------------------
  @Get("sub-categories")
  @ApiOperation({ summary: "Ambil daftar sub-kategori (01 s.d 20)" })
  @ApiQuery({ name: "categoryId", required: false, description: "Filter berdasarkan ID Kategori" })
  getSubCategories(@Query("categoryId") categoryId?: string) {
    return this.masterService.getSubCategories(categoryId);
  }

  @Post("sub-categories")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Tambah sub-kategori aset baru (Admin & Sarpras)" })
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.masterService.createSubCategory(dto);
  }

  @Patch("sub-categories/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Sub-Kategori" })
  @ApiOperation({ summary: "Ubah data sub-kategori aset (Admin & Sarpras)" })
  updateSubCategory(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubCategoryDto,
  ) {
    return this.masterService.updateSubCategory(id, dto);
  }

  @Delete("sub-categories/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Sub-Kategori" })
  @ApiOperation({ summary: "Hapus sub-kategori aset (ditolak bila masih digunakan master barang)" })
  deleteSubCategory(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterService.deleteSubCategory(id);
  }

  // -------------------------------------------------------------
  // ITEMS (MASTER KATALOG BARANG)
  // -------------------------------------------------------------
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

  @Patch("items/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Master Barang" })
  @ApiOperation({ summary: "Ubah data master barang (Admin & Sarpras)" })
  updateItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.masterService.updateItem(id, dto);
  }

  @Delete("items/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Master Barang" })
  @ApiOperation({ summary: "Hapus master barang (ditolak bila sudah dipakai di aset/pengadaan)" })
  deleteItem(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterService.deleteItem(id);
  }

  // -------------------------------------------------------------
  // ROOMS (MASTER RUANGAN)
  // -------------------------------------------------------------
  @Get("rooms")
  @ApiOperation({ summary: "Daftar ruangan sekolah & Penanggung Jawab Ruangan" })
  getRooms() {
    return this.masterService.getRooms();
  }

  @Post("rooms")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Tambah ruangan baru (Admin & Sarpras)" })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.masterService.createRoom(dto);
  }

  @Patch("rooms/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Ruangan" })
  @ApiOperation({ summary: "Ubah data ruangan (Admin & Sarpras)" })
  updateRoom(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.masterService.updateRoom(id, dto);
  }

  @Delete("rooms/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Ruangan" })
  @ApiOperation({ summary: "Hapus ruangan (ditolak bila masih digunakan aset/mutasi/audit)" })
  deleteRoom(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterService.deleteRoom(id);
  }

  // -------------------------------------------------------------
  // FUNDING SOURCES (SUMBER DANA)
  // -------------------------------------------------------------
  @Get("funding-sources")
  @ApiOperation({ summary: "Daftar sumber dana / perolehan (Swadaya, BOS, RMP, Hibah)" })
  getFundingSources() {
    return this.masterService.getFundingSources();
  }

  @Post("funding-sources")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Tambah sumber dana baru (Admin & Sarpras)" })
  createFundingSource(@Body() dto: CreateFundingSourceDto) {
    return this.masterService.createFundingSource(dto);
  }

  @Patch("funding-sources/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Sumber Dana" })
  @ApiOperation({ summary: "Ubah data sumber dana (Admin & Sarpras)" })
  updateFundingSource(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateFundingSourceDto,
  ) {
    return this.masterService.updateFundingSource(id, dto);
  }

  @Delete("funding-sources/:id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiParam({ name: "id", description: "UUID Sumber Dana" })
  @ApiOperation({ summary: "Hapus sumber dana (ditolak bila sudah dipakai di pengadaan)" })
  deleteFundingSource(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterService.deleteFundingSource(id);
  }
}
