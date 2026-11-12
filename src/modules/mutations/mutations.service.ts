import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateMutationDto } from "./dto/create-mutation.dto";
import { MutationStatus } from "@prisma/client";

@Injectable()
export class MutationsService {
  constructor(private prisma: PrismaService) {}

  async createMutation(dto: CreateMutationDto, proposerId: string) {
    const existing = await this.prisma.assetMutation.findUnique({
      where: { mutationNo: dto.mutationNo },
    });
    if (existing) {
      throw new ConflictException(`Nomor mutasi ${dto.mutationNo} sudah terdaftar`);
    }

    const asset = await this.prisma.assetItem.findUnique({
      where: { id: dto.assetItemId },
      include: { currentRoom: true },
    });
    if (!asset) {
      throw new NotFoundException("Aset tidak ditemukan");
    }

    const targetRoom = await this.prisma.room.findUnique({
      where: { id: dto.toRoomId },
    });
    if (!targetRoom) {
      throw new NotFoundException("Ruangan tujuan tidak ditemukan");
    }

    if (asset.currentRoomId === dto.toRoomId) {
      throw new BadRequestException("Ruangan tujuan sama dengan ruangan aset saat ini");
    }

    return this.prisma.assetMutation.create({
      data: {
        mutationNo: dto.mutationNo,
        assetItemId: asset.id,
        fromRoomId: asset.currentRoomId,
        toRoomId: dto.toRoomId,
        proposedBy: proposerId,
        reason: dto.reason,
        status: MutationStatus.PENDING,
      },
      include: {
        assetItem: { include: { item: true } },
        fromRoom: true,
        toRoom: true,
        proposer: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async getMutations() {
    return this.prisma.assetMutation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assetItem: { include: { item: true } },
        fromRoom: true,
        toRoom: true,
        proposer: { select: { id: true, fullName: true, role: true } },
        approver: { select: { id: true, fullName: true } },
      },
    });
  }

  async reviewMutation(
    id: string,
    approve: boolean,
    approverId: string,
    executeImmediately = false,
  ) {
    const mutation = await this.prisma.assetMutation.findUnique({
      where: { id },
    });
    if (!mutation) {
      throw new NotFoundException("Data mutasi tidak ditemukan");
    }

    if (mutation.status !== MutationStatus.PENDING) {
      throw new BadRequestException("Mutasi ini sudah diproses sebelumnya");
    }

    return this.prisma.$transaction(async (tx) => {
      const status = approve
        ? executeImmediately
          ? MutationStatus.COMPLETED
          : MutationStatus.APPROVED
        : MutationStatus.REJECTED;

      const updated = await tx.assetMutation.update({
        where: { id },
        data: {
          status,
          approvedBy: approverId,
          executedAt: approve && executeImmediately ? new Date() : null,
        },
        include: {
          assetItem: { include: { item: true } },
          fromRoom: true,
          toRoom: true,
        },
      });

      if (approve && executeImmediately) {
        // Automatically update asset current_room_id to target room
        await tx.assetItem.update({
          where: { id: mutation.assetItemId },
          data: {
            currentRoomId: mutation.toRoomId,
          },
        });
      }

      return updated;
    });
  }

  async executeMutation(id: string) {
    const mutation = await this.prisma.assetMutation.findUnique({
      where: { id },
    });
    if (!mutation) {
      throw new NotFoundException("Data mutasi tidak ditemukan");
    }

    if (mutation.status !== MutationStatus.APPROVED) {
      throw new BadRequestException(
        "Mutasi harus berstatus APPROVED sebelum pemindahan fisik dikonfirmasi selesai",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assetMutation.update({
        where: { id },
        data: {
          status: MutationStatus.COMPLETED,
          executedAt: new Date(),
        },
        include: {
          assetItem: { include: { item: true } },
          fromRoom: true,
          toRoom: true,
          proposer: { select: { id: true, fullName: true } },
          approver: { select: { id: true, fullName: true } },
        },
      });

      await tx.assetItem.update({
        where: { id: mutation.assetItemId },
        data: {
          currentRoomId: mutation.toRoomId,
        },
      });

      return updated;
    });
  }

  async getMutationBast(id: string) {
    const mutation = await this.prisma.assetMutation.findUnique({
      where: { id },
      include: {
        assetItem: { include: { item: true } },
        fromRoom: { include: { picUser: { select: { fullName: true, nipNuptk: true } } } },
        toRoom: { include: { picUser: { select: { fullName: true, nipNuptk: true } } } },
        proposer: { select: { id: true, fullName: true, nipNuptk: true, role: true } },
        approver: { select: { id: true, fullName: true, nipNuptk: true, role: true } },
      },
    });

    if (!mutation) {
      throw new NotFoundException("Data mutasi tidak ditemukan");
    }

    return {
      documentTitle: "BERITA ACARA SERAH TERIMA MUTASI ASET",
      schoolName: "SMP PGRI 7 BANDUNG",
      schoolAddress: "Jl. Kencanawangi Utara No. 20a, Bandung 40257",
      mutationNo: mutation.mutationNo,
      status: mutation.status,
      reason: mutation.reason,
      executedAt: mutation.executedAt,
      asset: {
        inventoryCode: mutation.assetItem.inventoryCode,
        name: mutation.assetItem.item.name,
        brand: mutation.assetItem.item.brand,
        modelType: mutation.assetItem.item.modelType,
        serialNumber: mutation.assetItem.serialNumber,
        condition: mutation.assetItem.condition,
      },
      fromRoom: mutation.fromRoom,
      toRoom: mutation.toRoom,
      proposer: mutation.proposer,
      approver: mutation.approver,
    };
  }
}
