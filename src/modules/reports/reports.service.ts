import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AssetCondition, AssetStatus } from "@prisma/client";
import * as ExcelJS from "exceljs";
import { Response } from "express";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveDashboard() {
    const [
      totalAssets,
      goodAssets,
      damagedAssets,
      heavilyDamagedAssets,
      lostAssets,
      borrowedAssets,
      maintenanceAssets,
      totalValuationAggregate,
      categories,
    ] = await Promise.all([
      this.prisma.assetItem.count({ where: { isDisposed: false } }),
      this.prisma.assetItem.count({ where: { isDisposed: false, condition: AssetCondition.GOOD } }),
      this.prisma.assetItem.count({ where: { isDisposed: false, condition: AssetCondition.SLIGHTLY_DAMAGED } }),
      this.prisma.assetItem.count({ where: { isDisposed: false, condition: AssetCondition.HEAVILY_DAMAGED } }),
      this.prisma.assetItem.count({ where: { isDisposed: false, condition: AssetCondition.LOST } }),
      this.prisma.assetItem.count({ where: { isDisposed: false, status: AssetStatus.BORROWED } }),
      this.prisma.assetItem.count({ where: { isDisposed: false, status: AssetStatus.UNDER_MAINTENANCE } }),
      this.prisma.assetItem.aggregate({
        where: { isDisposed: false },
        _sum: { currentValue: true, acquisitionPrice: true },
      }),
      this.prisma.category.findMany({
        include: {
          subCategories: {
            include: {
              items: {
                include: {
                  assetItems: { where: { isDisposed: false }, select: { currentValue: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const categoryDistribution = categories.map((cat) => {
      let count = 0;
      let totalValue = 0;
      for (const sub of cat.subCategories) {
        for (const item of sub.items) {
          count += item.assetItems.length;
          for (const a of item.assetItems) {
            totalValue += Number(a.currentValue);
          }
        }
      }
      return {
        code: cat.code,
        name: cat.name,
        totalItems: count,
        totalValue,
      };
    });

    return {
      kpi: {
        totalAssets,
        totalCurrentValue: Number(totalValuationAggregate._sum.currentValue || 0),
        totalAcquisitionValue: Number(totalValuationAggregate._sum.acquisitionPrice || 0),
        conditionPercentage: {
          good: totalAssets > 0 ? Number(((goodAssets / totalAssets) * 100).toFixed(1)) : 0,
          damaged: totalAssets > 0 ? Number(((damagedAssets / totalAssets) * 100).toFixed(1)) : 0,
          heavyDamaged: totalAssets > 0 ? Number(((heavilyDamagedAssets / totalAssets) * 100).toFixed(1)) : 0,
          lost: totalAssets > 0 ? Number(((lostAssets / totalAssets) * 100).toFixed(1)) : 0,
        },
        counts: {
          good: goodAssets,
          damaged: damagedAssets,
          heavilyDamaged: heavilyDamagedAssets,
          lost: lostAssets,
          borrowed: borrowedAssets,
          underMaintenance: maintenanceAssets,
        },
      },
      categoryDistribution,
    };
  }

  async exportBukuIndukExcel(res: Response) {
    const assets = await this.prisma.assetItem.findMany({
      where: { isDisposed: false },
      orderBy: { inventoryCode: "asc" },
      include: {
        item: { include: { subCategory: { include: { category: true } } } },
        currentRoom: true,
        procurement: { include: { fundingSource: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Buku Induk Inventaris");

    // Header Metadata
    worksheet.mergeCells("A1:K1");
    worksheet.getCell("A1").value = "BUKU INDUK INVENTARIS SARANA DAN PRASARANA";
    worksheet.getCell("A1").font = { name: "Segoe UI", size: 14, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:K2");
    worksheet.getCell("A2").value = "SMP PGRI 7 BANDUNG — TAHUN AJARAN 2026/2027";
    worksheet.getCell("A2").font = { name: "Segoe UI", size: 10, italic: true };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    worksheet.addRow([]);

    const tableHeaders = [
      "No",
      "Kode Inventaris",
      "Nama Barang",
      "Merek",
      "Satuan",
      "Ruangan / Lokasi",
      "Sumber Dana",
      "Tahun Pengadaan",
      "Harga Perolehan (Rp)",
      "Nilai Terkini (Rp)",
      "Kondisi Fisik",
    ];

    const headerRow = worksheet.addRow(tableHeaders);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1E293B" },
      };
      cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    assets.forEach((a, idx) => {
      const row = worksheet.addRow([
        idx + 1,
        a.inventoryCode,
        a.item.name,
        a.item.brand,
        a.item.unit,
        a.currentRoom.name,
        a.procurement.fundingSource.name,
        new Date(a.procurement.procurementDate).getFullYear(),
        Number(a.acquisitionPrice),
        Number(a.currentValue),
        a.condition,
      ]);

      row.eachCell((cell, colNum) => {
        cell.font = { name: "Segoe UI", size: 9 };
        cell.border = {
          top: { style: "thin", color: { argb: "CBD5E1" } },
          bottom: { style: "thin", color: { argb: "CBD5E1" } },
          left: { style: "thin", color: { argb: "CBD5E1" } },
          right: { style: "thin", color: { argb: "CBD5E1" } },
        };
        if (colNum === 1 || colNum === 8 || colNum === 11) {
          cell.alignment = { horizontal: "center" };
        } else if (colNum === 9 || colNum === 10) {
          cell.numFmt = "#,##0";
          cell.alignment = { horizontal: "right" };
        }
      });
    });

    worksheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const valStr = cell.value ? cell.value.toString() : "";
        if (valStr.length > maxLen) maxLen = Math.min(valStr.length + 2, 40);
      });
      column.width = maxLen;
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="Buku_Induk_Inventaris_SMP_PGRI7.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  }

  async getDirReport(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        picUser: { select: { id: true, fullName: true, nipNuptk: true } },
      },
    });

    if (!room) {
      throw new NotFoundException("Ruangan tidak ditemukan");
    }

    const assets = await this.prisma.assetItem.findMany({
      where: { currentRoomId: roomId, isDisposed: false },
      include: {
        item: { include: { subCategory: true } },
      },
      orderBy: { inventoryCode: "asc" },
    });

    return {
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        buildingName: room.buildingName,
        floor: room.floor,
        picName: room.picUser?.fullName || "Belum ditentukan",
        picNip: room.picUser?.nipNuptk || "-",
      },
      totalItems: assets.length,
      items: assets.map((a) => ({
        inventoryCode: a.inventoryCode,
        itemName: a.item.name,
        brand: a.item.brand,
        unit: a.item.unit,
        condition: a.condition,
        status: a.status,
      })),
    };
  }
}
