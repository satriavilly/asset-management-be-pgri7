import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDisposalDto } from "./dto/create-disposal.dto";
import { AssetStatus } from "@prisma/client";

@Injectable()
export class DisposalsService {
  constructor(private prisma: PrismaService) {}

  async createDisposal(dto: CreateDisposalDto, executorId: string) {
    const existing = await this.prisma.assetDisposal.findUnique({
      where: { disposalNo: dto.disposalNo },
    });
    if (existing) {
      throw new ConflictException(`Nomor berita acara ${dto.disposalNo} sudah terdaftar`);
    }

    const asset = await this.prisma.assetItem.findUnique({
      where: { id: dto.assetItemId },
      include: { item: true, currentRoom: true },
    });
    if (!asset) {
      throw new NotFoundException("Aset tidak ditemukan");
    }

    if (asset.isDisposed) {
      throw new BadRequestException("Aset ini sudah pernah dihapus/dimusnahkan sebelumnya");
    }

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Create disposal record with 2 witnesses
        const disposal = await tx.assetDisposal.create({
          data: {
            disposalNo: dto.disposalNo,
            assetItemId: dto.assetItemId,
            disposalDate: new Date(dto.disposalDate),
            disposalMethod: dto.disposalMethod,
            reason: dto.reason,
            witness1Name: dto.witness1Name,
            witness1Role: dto.witness1Role,
            witness2Name: dto.witness2Name,
            witness2Role: dto.witness2Role,
            evidenceDocUrl: dto.evidenceDocUrl,
            executedBy: executorId,
          },
          include: {
            assetItem: { include: { item: true, currentRoom: true } },
            executor: { select: { id: true, fullName: true, role: true } },
          },
        });

        // 2. Soft-delete the asset in asset_items table
        await tx.assetItem.update({
          where: { id: dto.assetItemId },
          data: {
            isDisposed: true,
            status: AssetStatus.DISPOSED,
          },
        });

        return disposal;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async getDisposals() {
    return this.prisma.assetDisposal.findMany({
      orderBy: { disposalDate: "desc" },
      include: {
        assetItem: {
          include: {
            item: { include: { subCategory: { include: { category: true } } } },
            currentRoom: true,
          },
        },
        executor: { select: { id: true, fullName: true } },
      },
    });
  }

  async getDisposalById(id: string) {
    const disposal = await this.prisma.assetDisposal.findUnique({
      where: { id },
      include: {
        assetItem: {
          include: {
            item: { include: { subCategory: { include: { category: true } } } },
            currentRoom: true,
            procurement: { include: { fundingSource: true } },
          },
        },
        executor: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (!disposal) {
      throw new NotFoundException("Data pemusnahan aset tidak ditemukan");
    }

    return disposal;
  }

  async getDisposalBast(id: string) {
    const disposal = await this.getDisposalById(id);
    return {
      documentTitle: "BERITA ACARA PENGHAPUSAN / PEMUSNAHAN ASET",
      schoolName: "SMP PGRI 7 BANDUNG",
      schoolAddress: "Jl. Kencanawangi Utara No. 20a, Bandung 40257",
      disposalNo: disposal.disposalNo,
      disposalDate: disposal.disposalDate,
      disposalMethod: disposal.disposalMethod,
      reason: disposal.reason,
      evidenceDocUrl: disposal.evidenceDocUrl,
      asset: {
        inventoryCode: disposal.assetItem.inventoryCode,
        name: disposal.assetItem.item.name,
        brand: disposal.assetItem.item.brand,
        modelType: disposal.assetItem.item.modelType,
        serialNumber: disposal.assetItem.serialNumber,
        acquisitionPrice: Number(disposal.assetItem.acquisitionPrice),
        currentValue: Number(disposal.assetItem.currentValue),
        lastRoom: disposal.assetItem.currentRoom.name,
      },
      witnesses: [
        { name: disposal.witness1Name, role: disposal.witness1Role },
        { name: disposal.witness2Name, role: disposal.witness2Role },
      ],
      executor: disposal.executor,
    };
  }
}
