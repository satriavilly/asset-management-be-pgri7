import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateValuationDto } from "./dto/update-valuation.dto";
import { AssetCondition, AssetStatus } from "@prisma/client";

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async getAssets(params: {
    search?: string;
    roomId?: string;
    categoryId?: string;
    condition?: AssetCondition;
    status?: AssetStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ? Number(params.page) : 1;
    const limit = params.limit ? Number(params.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isDisposed: false,
    };

    if (params.roomId) where.currentRoomId = params.roomId;
    if (params.condition) where.condition = params.condition;
    if (params.status) where.status = params.status;
    if (params.categoryId) {
      where.item = { subCategory: { categoryId: params.categoryId } };
    }
    if (params.search) {
      where.OR = [
        { inventoryCode: { contains: params.search, mode: "insensitive" } },
        { serialNumber: { contains: params.search, mode: "insensitive" } },
        { item: { name: { contains: params.search, mode: "insensitive" } } },
        { item: { brand: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.assetItem.count({ where }),
      this.prisma.assetItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { inventoryCode: "asc" },
        include: {
          item: {
            include: { subCategory: { include: { category: true } } },
          },
          currentRoom: true,
          procurement: {
            include: { fundingSource: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async getAssetById(id: string) {
    const asset = await this.prisma.assetItem.findUnique({
      where: { id },
      include: {
        item: {
          include: { subCategory: { include: { category: true } } },
        },
        currentRoom: {
          include: { picUser: true },
        },
        procurement: {
          include: { fundingSource: true, creator: true },
        },
        mutations: {
          orderBy: { createdAt: "desc" },
          include: { fromRoom: true, toRoom: true, proposer: true },
        },
        maintenances: {
          orderBy: { createdAt: "desc" },
          include: { reporter: true },
        },
        loanItems: {
          orderBy: { id: "desc" },
          include: { loan: true },
        },
        disposal: true,
      },
    });

    if (!asset) {
      throw new NotFoundException("Aset tidak ditemukan");
    }

    return asset;
  }

  async lookupByCode(inventoryCode: string) {
    const asset = await this.prisma.assetItem.findUnique({
      where: { inventoryCode },
      include: {
        item: {
          include: { subCategory: { include: { category: true } } },
        },
        currentRoom: true,
        procurement: {
          include: { fundingSource: true },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Aset dengan kode ${inventoryCode} tidak ditemukan`);
    }

    return asset;
  }

  async updateValuation(id: string, dto: UpdateValuationDto) {
    const asset = await this.prisma.assetItem.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException("Aset tidak ditemukan");
    }

    const updated = await this.prisma.assetItem.update({
      where: { id },
      data: {
        currentValue: dto.currentValue,
      },
      include: {
        item: true,
        currentRoom: true,
      },
    });

    return {
      message: "Nilai buku aset berhasil diperbarui",
      data: updated,
    };
  }

  async getLabelData(id: string) {
    const asset = await this.getAssetById(id);

    return {
      schoolName: "SMP PGRI 7 BANDUNG",
      schoolAddress: "Jl. Kencanawangi Utara No. 20a, Bandung 40257",
      inventoryCode: asset.inventoryCode,
      itemName: asset.item.name,
      brand: asset.item.brand,
      roomName: asset.currentRoom.name,
      fundingSource: asset.procurement.fundingSource.name,
      procurementYear: new Date(asset.procurement.procurementDate).getFullYear(),
      qrCodeUrl: asset.qrCodeUrl,
      printDimensions: {
        widthMm: 100,
        heightMm: 50,
        orientation: "landscape",
      },
    };
  }
}
