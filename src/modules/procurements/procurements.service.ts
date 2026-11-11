import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateProcurementDto } from "./dto/create-procurement.dto";
import { AssetCondition, AssetStatus } from "@prisma/client";
import * as QRCode from "qrcode";

@Injectable()
export class ProcurementsService {
  constructor(private prisma: PrismaService) {}

  async createProcurement(dto: CreateProcurementDto, userId: string) {
    const existing = await this.prisma.procurement.findUnique({
      where: { procurementNo: dto.procurementNo },
    });
    if (existing) {
      throw new ConflictException(`Pengadaan dengan nomor ${dto.procurementNo} sudah terdaftar`);
    }

    const funding = await this.prisma.fundingSource.findUnique({
      where: { id: dto.fundingSourceId },
    });
    if (!funding) {
      throw new NotFoundException("Sumber dana tidak ditemukan");
    }

    const procDate = new Date(dto.procurementDate);
    const procYear = procDate.getFullYear();

    // Execute in transaction: create procurement, procurement_items, and generate asset_items
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      for (const item of dto.items) {
        totalAmount += item.quantity * item.unitPrice;
      }

      const procurement = await tx.procurement.create({
        data: {
          procurementNo: dto.procurementNo,
          fundingSourceId: dto.fundingSourceId,
          procurementDate: procDate,
          receiptBastNo: dto.receiptBastNo,
          totalAmount,
          createdBy: userId,
        },
      });

      const createdAssetItems: any[] = [];

      for (const itemInput of dto.items) {
        const itemMaster = await tx.item.findUnique({
          where: { id: itemInput.itemId },
          include: {
            subCategory: {
              include: { category: true },
            },
          },
        });

        if (!itemMaster) {
          throw new NotFoundException(`Item dengan ID ${itemInput.itemId} tidak ditemukan`);
        }

        const room = await tx.room.findUnique({
          where: { id: itemInput.targetRoomId },
        });
        if (!room) {
          throw new NotFoundException(`Ruangan dengan ID ${itemInput.targetRoomId} tidak ditemukan`);
        }

        // 1. Create ProcurementItem record
        const lineTotal = itemInput.quantity * itemInput.unitPrice;
        await tx.procurementItem.create({
          data: {
            procurementId: procurement.id,
            itemId: itemMaster.id,
            quantity: itemInput.quantity,
            unitPrice: itemInput.unitPrice,
            totalPrice: lineTotal,
          },
        });

        // 2. Generate each physical AssetItem with Formula: [Kategori].[SubKategori].[NoUrut].PGRI7.[Tahun]
        const catCode = itemMaster.subCategory.category.code; // e.g. "C"
        const subCatCode = itemMaster.subCategory.code;        // e.g. "02"
        const prefix = `${catCode}.${subCatCode}.`;
        const suffix = `.PGRI7.${procYear}`;

        // Find last registered sequence for this category + subcategory + year
        const lastAsset = await tx.assetItem.findFirst({
          where: {
            inventoryCode: {
              startsWith: prefix,
              endsWith: suffix,
            },
          },
          orderBy: { inventoryCode: "desc" },
          select: { inventoryCode: true },
        });

        let currentSeq = 0;
        if (lastAsset) {
          // Extract 3-digit sequence: "C.02.010.PGRI7.2025" -> parts: ["C", "02", "010", "PGRI7", "2025"]
          const parts = lastAsset.inventoryCode.split(".");
          if (parts.length >= 5) {
            const parsed = parseInt(parts[2], 10);
            if (!isNaN(parsed)) currentSeq = parsed;
          }
        }

        for (let q = 1; q <= itemInput.quantity; q++) {
          currentSeq += 1;
          const seqPadded = String(currentSeq).padStart(3, "0");
          const inventoryCode = `${catCode}.${subCatCode}.${seqPadded}.PGRI7.${procYear}`;

          // Generate QR Code data string & Data URL
          const qrPayload = JSON.stringify({
            code: inventoryCode,
            item: itemMaster.name,
            brand: itemMaster.brand,
            school: "SMP PGRI 7 Bandung",
            url: `https://aset.smppgri7bdg.sch.id/scan/${inventoryCode}`,
          });
          const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 300,
          });

          const assetItem = await tx.assetItem.create({
            data: {
              inventoryCode,
              itemId: itemMaster.id,
              procurementId: procurement.id,
              currentRoomId: room.id,
              acquisitionPrice: itemInput.unitPrice,
              currentValue: itemInput.unitPrice,
              condition: AssetCondition.GOOD,
              status: AssetStatus.AVAILABLE,
              qrCodeUrl,
            },
          });

          createdAssetItems.push(assetItem);
        }
      }

      return {
        procurement,
        totalItemsGenerated: createdAssetItems.length,
        generatedCodes: createdAssetItems.map((a) => a.inventoryCode),
      };
    });
  }

  async getProcurements() {
    return this.prisma.procurement.findMany({
      orderBy: { procurementDate: "desc" },
      include: {
        fundingSource: true,
        creator: { select: { id: true, fullName: true, role: true } },
        items: {
          include: {
            item: {
              include: { subCategory: { include: { category: true } } },
            },
          },
        },
        _count: { select: { assetItems: true } },
      },
    });
  }

  async getProcurementById(id: string) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id },
      include: {
        fundingSource: true,
        creator: { select: { id: true, fullName: true, role: true } },
        items: {
          include: {
            item: {
              include: { subCategory: { include: { category: true } } },
            },
          },
        },
        assetItems: {
          include: {
            currentRoom: true,
            item: true,
          },
        },
      },
    });

    if (!procurement) {
      throw new NotFoundException("Transaksi pengadaan tidak ditemukan");
    }

    return procurement;
  }
}
