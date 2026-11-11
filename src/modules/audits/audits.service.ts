import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateAuditSessionDto, ScanAuditItemDto } from "./dto/create-audit-session.dto";
import { AuditMatch, AuditStatus } from "@prisma/client";

@Injectable()
export class AuditsService {
  constructor(private prisma: PrismaService) {}

  async createSession(dto: CreateAuditSessionDto, auditorId: string) {
    return this.prisma.auditSession.create({
      data: {
        sessionName: dto.sessionName,
        auditYear: dto.auditYear,
        startDate: new Date(dto.startDate),
        auditorId,
        status: AuditStatus.OPEN,
      },
      include: {
        auditor: { select: { id: true, fullName: true } },
      },
    });
  }

  async getSessions() {
    return this.prisma.auditSession.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        auditor: { select: { id: true, fullName: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async scanItem(sessionId: string, dto: ScanAuditItemDto) {
    const session = await this.prisma.auditSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException("Sesi audit tidak ditemukan");
    }
    if (session.status === AuditStatus.COMPLETED) {
      throw new BadRequestException("Sesi audit ini sudah ditutup");
    }

    // Lookup asset by ID or inventory code
    const asset = await this.prisma.assetItem.findFirst({
      where: {
        OR: [
          { id: dto.assetIdentifier },
          { inventoryCode: dto.assetIdentifier },
        ],
      },
      include: { currentRoom: true, item: true },
    });

    if (!asset) {
      throw new NotFoundException(`Aset '${dto.assetIdentifier}' tidak terdaftar di sistem`);
    }

    const scannedRoom = await this.prisma.room.findUnique({
      where: { id: dto.scannedRoomId },
    });
    if (!scannedRoom) {
      throw new NotFoundException("Ruangan scan tidak ditemukan");
    }

    // Calculate match status: MATCH or MISPLACED
    const matchStatus =
      asset.currentRoomId === dto.scannedRoomId
        ? AuditMatch.MATCH
        : AuditMatch.MISPLACED;

    // Upsert audit item in this session
    const auditItem = await this.prisma.auditItem.create({
      data: {
        auditSessionId: session.id,
        assetItemId: asset.id,
        scannedRoomId: dto.scannedRoomId,
        systemRoomId: asset.currentRoomId,
        physicalCondition: dto.physicalCondition,
        matchStatus,
      },
      include: {
        assetItem: { include: { item: true } },
        scannedRoom: true,
        systemRoom: true,
      },
    });

    // Update asset condition to match physical condition if changed
    if (asset.condition !== dto.physicalCondition) {
      await this.prisma.assetItem.update({
        where: { id: asset.id },
        data: { condition: dto.physicalCondition },
      });
    }

    return {
      message: matchStatus === AuditMatch.MATCH ? "Aset sesuai dengan ruangan tercatat" : "Peringatan: Aset ditemukan di ruangan berbeda dari data sistem",
      data: auditItem,
    };
  }

  async getReconciliation(sessionId: string) {
    const session = await this.prisma.auditSession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            assetItem: { include: { item: true } },
            scannedRoom: true,
            systemRoom: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Sesi audit tidak ditemukan");
    }

    const scannedAssetIds = new Set(session.items.map((it) => it.assetItemId));

    // Find all active assets in database that were not scanned (MISSING)
    const allActiveAssets = await this.prisma.assetItem.findMany({
      where: { isDisposed: false },
      include: { item: true, currentRoom: true },
    });

    const missingAssets = allActiveAssets
      .filter((a) => !scannedAssetIds.has(a.id))
      .map((a) => ({
        id: a.id,
        inventoryCode: a.inventoryCode,
        itemName: a.item.name,
        brand: a.item.brand,
        systemRoom: a.currentRoom.name,
        matchStatus: AuditMatch.MISSING,
      }));

    const matchedCount = session.items.filter((i) => i.matchStatus === AuditMatch.MATCH).length;
    const misplacedCount = session.items.filter((i) => i.matchStatus === AuditMatch.MISPLACED).length;
    const missingCount = missingAssets.length;

    return {
      sessionId: session.id,
      sessionName: session.sessionName,
      auditYear: session.auditYear,
      status: session.status,
      stats: {
        totalSystemAssets: allActiveAssets.length,
        totalScanned: session.items.length,
        matched: matchedCount,
        misplaced: misplacedCount,
        missing: missingCount,
        reconciliationPercentage: allActiveAssets.length > 0
          ? Number(((matchedCount / allActiveAssets.length) * 100).toFixed(1))
          : 0,
      },
      scannedItems: session.items,
      missingItems: missingAssets,
    };
  }

  async closeSession(sessionId: string) {
    const session = await this.prisma.auditSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException("Sesi audit tidak ditemukan");
    }

    return this.prisma.auditSession.update({
      where: { id: sessionId },
      data: {
        status: AuditStatus.COMPLETED,
        endDate: new Date(),
      },
    });
  }
}
