import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { CreateRoomDto } from "./dto/create-room.dto";

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { subCategories: true } },
      },
    });
  }

  // SubCategories
  async getSubCategories(categoryId?: string) {
    return this.prisma.subCategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ category: { code: "asc" } }, { code: "asc" }],
      include: {
        category: true,
      },
    });
  }

  // Items
  async getItems(search?: string, subCategoryId?: string) {
    return this.prisma.item.findMany({
      where: {
        subCategoryId: subCategoryId || undefined,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        subCategory: {
          include: { category: true },
        },
        _count: { select: { assetItems: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async createItem(dto: CreateItemDto) {
    const subCat = await this.prisma.subCategory.findUnique({
      where: { id: dto.subCategoryId },
    });
    if (!subCat) {
      throw new NotFoundException("Sub-kategori tidak ditemukan");
    }

    return this.prisma.item.create({
      data: dto,
      include: {
        subCategory: { include: { category: true } },
      },
    });
  }

  // Rooms
  async getRooms() {
    return this.prisma.room.findMany({
      orderBy: { code: "asc" },
      include: {
        picUser: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
        _count: {
          select: { currentAssets: true },
        },
      },
    });
  }

  async createRoom(dto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Ruangan dengan kode ${dto.code} sudah ada`);
    }

    return this.prisma.room.create({
      data: dto,
      include: {
        picUser: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  // Funding Sources
  async getFundingSources() {
    return this.prisma.fundingSource.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { procurements: true } },
      },
    });
  }
}
