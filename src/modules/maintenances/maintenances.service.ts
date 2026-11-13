import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ReportDamageDto, TriageMaintenanceDto } from "./dto/report-damage.dto";
import { AssetCondition, AssetStatus, MaintenanceStatus, MaintenanceType } from "@prisma/client";

@Injectable()
export class MaintenancesService {
  constructor(private prisma: PrismaService) {}

  async reportDamage(dto: ReportDamageDto, reporterId: string) {
    const asset = await this.prisma.assetItem.findUnique({
      where: { id: dto.assetItemId },
    });
    if (!asset) {
      throw new NotFoundException("Aset tidak ditemukan");
    }

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Create maintenance record
        const maintenance = await tx.assetMaintenance.create({
          data: {
            assetItemId: dto.assetItemId,
            reportedBy: reporterId,
            damageDescription: dto.damageDescription,
            damagePhotoUrl: dto.damagePhotoUrl,
            status: MaintenanceStatus.REPORTED,
          },
          include: {
            assetItem: { include: { item: true, currentRoom: true } },
            reporter: { select: { id: true, fullName: true, role: true } },
          },
        });

        // 2. Update asset status to UNDER_MAINTENANCE and condition to SLIGHTLY_DAMAGED
        await tx.assetItem.update({
          where: { id: dto.assetItemId },
          data: {
            status: AssetStatus.UNDER_MAINTENANCE,
            condition: AssetCondition.SLIGHTLY_DAMAGED,
          },
        });

        return maintenance;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async getMaintenances() {
    return this.prisma.assetMaintenance.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assetItem: {
          include: { item: true, currentRoom: true },
        },
        reporter: {
          select: { id: true, fullName: true, role: true, phoneNumber: true },
        },
      },
    });
  }

  async triageMaintenance(id: string, dto: TriageMaintenanceDto) {
    const maintenance = await this.prisma.assetMaintenance.findUnique({
      where: { id },
      include: { assetItem: true },
    });
    if (!maintenance) {
      throw new NotFoundException("Laporan pemeliharaan tidak ditemukan");
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (dto.escalateToDisposal) {
          // Escalate to disposal: heavily damaged
          await tx.assetMaintenance.update({
            where: { id },
            data: {
              status: MaintenanceStatus.ESCALATED_DISPOSAL,
            },
          });

          await tx.assetItem.update({
            where: { id: maintenance.assetItemId },
            data: {
              condition: AssetCondition.HEAVILY_DAMAGED,
            },
          });

          return {
            message: "Aset rusak berat dan dialihkan ke alur pemusnahan aset (Disposal)",
            status: MaintenanceStatus.ESCALATED_DISPOSAL,
          };
        }

        const updated = await tx.assetMaintenance.update({
          where: { id },
          data: {
            maintenanceType: dto.maintenanceType,
            vendorName: dto.vendorName,
            cost: dto.cost || 0,
            status: MaintenanceStatus.IN_PROGRESS,
          },
        });

        return updated;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async completeMaintenance(id: string, realCost?: number) {
    const maintenance = await this.prisma.assetMaintenance.findUnique({
      where: { id },
    });
    if (!maintenance) {
      throw new NotFoundException("Laporan pemeliharaan tidak ditemukan");
    }

    return this.prisma.$transaction(
      async (tx) => {
        const updated = await tx.assetMaintenance.update({
          where: { id },
          data: {
            status: MaintenanceStatus.COMPLETED,
            completedAt: new Date(),
            cost: realCost !== undefined ? realCost : maintenance.cost,
          },
        });

        // Restore asset to AVAILABLE and GOOD condition
        await tx.assetItem.update({
          where: { id: maintenance.assetItemId },
          data: {
            status: AssetStatus.AVAILABLE,
            condition: AssetCondition.GOOD,
          },
        });

        return updated;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }
}
