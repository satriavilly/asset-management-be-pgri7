import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
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

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { subCategories: true } },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Kategori dengan kode ${dto.code} sudah ada`);
    }

    return this.prisma.category.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      },
      include: {
        _count: { select: { subCategories: true } },
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException("Kategori tidak ditemukan");
    }

    if (dto.code !== undefined && dto.code !== current.code) {
      const duplicate = await this.prisma.category.findUnique({
        where: { code: dto.code },
      });
      if (duplicate) {
        throw new ConflictException(`Kategori dengan kode ${dto.code} sudah ada`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: {
        _count: { select: { subCategories: true } },
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { subCategories: true } } },
    });
    if (!category) {
      throw new NotFoundException("Kategori tidak ditemukan");
    }
    if (category._count.subCategories > 0) {
      throw new ConflictException(
        `Kategori tidak dapat dihapus karena masih memiliki ${category._count.subCategories} sub-kategori`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: "Kategori berhasil dihapus", id };
  }

  // -------------------------------------------------------------
  // SUB-CATEGORIES
  // -------------------------------------------------------------
  async getSubCategories(categoryId?: string) {
    return this.prisma.subCategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ category: { code: "asc" } }, { code: "asc" }],
      include: {
        category: true,
        _count: { select: { items: true } },
      },
    });
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException("Kategori tidak ditemukan");
    }

    const existing = await this.prisma.subCategory.findUnique({
      where: {
        categoryId_code: {
          categoryId: dto.categoryId,
          code: dto.code,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Sub-kategori dengan kode ${dto.code} pada kategori ${category.code} sudah ada`,
      );
    }

    return this.prisma.subCategory.create({
      data: {
        categoryId: dto.categoryId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      },
      include: {
        category: true,
        _count: { select: { items: true } },
      },
    });
  }

  async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
    const current = await this.prisma.subCategory.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException("Sub-kategori tidak ditemukan");
    }

    const nextCategoryId = dto.categoryId ?? current.categoryId;
    const nextCode = dto.code ?? current.code;

    if (dto.categoryId !== undefined && dto.categoryId !== current.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException("Kategori tidak ditemukan");
      }
    }

    if (nextCategoryId !== current.categoryId || nextCode !== current.code) {
      const duplicate = await this.prisma.subCategory.findUnique({
        where: {
          categoryId_code: {
            categoryId: nextCategoryId,
            code: nextCode,
          },
        },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Sub-kategori dengan kode ${nextCode} pada kategori tersebut sudah ada`,
        );
      }
    }

    return this.prisma.subCategory.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: {
        category: true,
        _count: { select: { items: true } },
      },
    });
  }

  async deleteSubCategory(id: string) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!subCategory) {
      throw new NotFoundException("Sub-kategori tidak ditemukan");
    }
    if (subCategory._count.items > 0) {
      throw new ConflictException(
        `Sub-kategori tidak dapat dihapus karena masih digunakan oleh ${subCategory._count.items} master barang`,
      );
    }

    await this.prisma.subCategory.delete({ where: { id } });
    return { message: "Sub-kategori berhasil dihapus", id };
  }

  // -------------------------------------------------------------
  // ITEMS (MASTER KATALOG BARANG)
  // -------------------------------------------------------------
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
      data: {
        subCategoryId: dto.subCategoryId,
        name: dto.name,
        brand: dto.brand ?? null,
        modelType: dto.modelType ?? null,
        unit: dto.unit,
        specifications: dto.specifications ?? null,
      },
      include: {
        subCategory: { include: { category: true } },
        _count: { select: { assetItems: true } },
      },
    });
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    const current = await this.prisma.item.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException("Master barang tidak ditemukan");
    }

    if (dto.subCategoryId !== undefined && dto.subCategoryId !== current.subCategoryId) {
      const subCat = await this.prisma.subCategory.findUnique({
        where: { id: dto.subCategoryId },
      });
      if (!subCat) {
        throw new NotFoundException("Sub-kategori tidak ditemukan");
      }
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.subCategoryId !== undefined ? { subCategoryId: dto.subCategoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
        ...(dto.modelType !== undefined ? { modelType: dto.modelType } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.specifications !== undefined ? { specifications: dto.specifications } : {}),
      },
      include: {
        subCategory: { include: { category: true } },
        _count: { select: { assetItems: true } },
      },
    });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assetItems: true,
            procurementItems: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException("Master barang tidak ditemukan");
    }
    if (item._count.assetItems > 0) {
      throw new ConflictException(
        `Master barang tidak dapat dihapus karena masih digunakan oleh ${item._count.assetItems} unit aset`,
      );
    }
    if (item._count.procurementItems > 0) {
      throw new ConflictException(
        `Master barang tidak dapat dihapus karena masih tercatat pada ${item._count.procurementItems} riwayat pengadaan`,
      );
    }

    await this.prisma.item.delete({ where: { id } });
    return { message: "Master barang berhasil dihapus", id };
  }

  // -------------------------------------------------------------
  // ROOMS (MASTER RUANGAN)
  // -------------------------------------------------------------
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

    if (dto.picUserId) {
      const picUser = await this.prisma.user.findUnique({
        where: { id: dto.picUserId },
      });
      if (!picUser) {
        throw new NotFoundException("User penanggung jawab ruangan tidak ditemukan");
      }
    }

    return this.prisma.room.create({
      data: {
        code: dto.code,
        name: dto.name,
        buildingName: dto.buildingName ?? null,
        floor: dto.floor ?? 1,
        picUserId: dto.picUserId ?? null,
      },
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

  async updateRoom(id: string, dto: UpdateRoomDto) {
    const current = await this.prisma.room.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException("Ruangan tidak ditemukan");
    }

    if (dto.code !== undefined && dto.code !== current.code) {
      const duplicate = await this.prisma.room.findUnique({
        where: { code: dto.code },
      });
      if (duplicate) {
        throw new ConflictException(`Ruangan dengan kode ${dto.code} sudah ada`);
      }
    }

    if (dto.picUserId) {
      const picUser = await this.prisma.user.findUnique({
        where: { id: dto.picUserId },
      });
      if (!picUser) {
        throw new NotFoundException("User penanggung jawab ruangan tidak ditemukan");
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.buildingName !== undefined ? { buildingName: dto.buildingName } : {}),
        ...(dto.floor !== undefined ? { floor: dto.floor } : {}),
        ...(dto.picUserId !== undefined ? { picUserId: dto.picUserId } : {}),
      },
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

  async deleteRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            currentAssets: true,
            mutationsFrom: true,
            mutationsTo: true,
            scannedAudits: true,
            systemAudits: true,
          },
        },
      },
    });
    if (!room) {
      throw new NotFoundException("Ruangan tidak ditemukan");
    }
    if (room._count.currentAssets > 0) {
      throw new ConflictException(
        `Ruangan tidak dapat dihapus karena masih menampung ${room._count.currentAssets} unit aset`,
      );
    }
    if (room._count.mutationsFrom > 0 || room._count.mutationsTo > 0) {
      throw new ConflictException(
        "Ruangan tidak dapat dihapus karena masih tercatat dalam riwayat mutasi aset",
      );
    }
    if (room._count.scannedAudits > 0 || room._count.systemAudits > 0) {
      throw new ConflictException(
        "Ruangan tidak dapat dihapus karena masih tercatat dalam riwayat stock opname",
      );
    }

    await this.prisma.room.delete({ where: { id } });
    return { message: "Ruangan berhasil dihapus", id };
  }

  // -------------------------------------------------------------
  // FUNDING SOURCES (SUMBER DANA)
  // -------------------------------------------------------------
  async getFundingSources() {
    return this.prisma.fundingSource.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { procurements: true } },
      },
    });
  }

  async createFundingSource(dto: CreateFundingSourceDto) {
    const existing = await this.prisma.fundingSource.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Sumber dana dengan kode ${dto.code} sudah ada`);
    }

    return this.prisma.fundingSource.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      },
      include: {
        _count: { select: { procurements: true } },
      },
    });
  }

  async updateFundingSource(id: string, dto: UpdateFundingSourceDto) {
    const current = await this.prisma.fundingSource.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException("Sumber dana tidak ditemukan");
    }

    if (dto.code !== undefined && dto.code !== current.code) {
      const duplicate = await this.prisma.fundingSource.findUnique({
        where: { code: dto.code },
      });
      if (duplicate) {
        throw new ConflictException(`Sumber dana dengan kode ${dto.code} sudah ada`);
      }
    }

    return this.prisma.fundingSource.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: {
        _count: { select: { procurements: true } },
      },
    });
  }

  async deleteFundingSource(id: string) {
    const fundingSource = await this.prisma.fundingSource.findUnique({
      where: { id },
      include: { _count: { select: { procurements: true } } },
    });
    if (!fundingSource) {
      throw new NotFoundException("Sumber dana tidak ditemukan");
    }
    if (fundingSource._count.procurements > 0) {
      throw new ConflictException(
        `Sumber dana tidak dapat dihapus karena masih digunakan pada ${fundingSource._count.procurements} transaksi pengadaan`,
      );
    }

    await this.prisma.fundingSource.delete({ where: { id } });
    return { message: "Sumber dana berhasil dihapus", id };
  }
}
