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

  async reviewMutation(id: string, approve: boolean, approverId: string) {
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
      const status = approve ? MutationStatus.APPROVED : MutationStatus.REJECTED;

      const updated = await tx.assetMutation.update({
        where: { id },
        data: {
          status,
          approvedBy: approverId,
          executedAt: approve ? new Date() : null,
        },
      });

      if (approve) {
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
}
