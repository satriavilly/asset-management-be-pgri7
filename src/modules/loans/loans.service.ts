import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateLoanDto, ReturnLoanDto } from "./dto/create-loan.dto";
import { AssetCondition, AssetStatus, LoanStatus } from "@prisma/client";

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async checkAvailability(assetItemIds: string[], startDateStr: string, expectedReturnDateStr: string) {
    const startDate = new Date(startDateStr);
    const expectedReturnDate = new Date(expectedReturnDateStr);

    if (startDate > expectedReturnDate) {
      throw new BadRequestException("Tanggal mulai pinjam tidak boleh melebihi tanggal pengembalian");
    }

    const conflicts: { assetItemId: string; inventoryCode: string; conflictingLoanNo: string }[] = [];

    for (const assetId of assetItemIds) {
      const asset = await this.prisma.assetItem.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new NotFoundException(`Aset ID ${assetId} tidak ditemukan`);
      }

      if (asset.isDisposed || asset.status === AssetStatus.DISPOSED || asset.status === AssetStatus.UNDER_MAINTENANCE) {
        conflicts.push({
          assetItemId: asset.id,
          inventoryCode: asset.inventoryCode,
          conflictingLoanNo: `Status aset saat ini: ${asset.status}`,
        });
        continue;
      }

      // Check overlapping loans with status APPROVED or ON_LOAN
      const existingConflict = await this.prisma.assetLoanItem.findFirst({
        where: {
          assetItemId: assetId,
          loan: {
            status: { in: [LoanStatus.APPROVED, LoanStatus.ON_LOAN] },
            AND: [
              { startDate: { lte: expectedReturnDate } },
              { expectedReturnDate: { gte: startDate } },
            ],
          },
        },
        include: { loan: true },
      });

      if (existingConflict) {
        conflicts.push({
          assetItemId: asset.id,
          inventoryCode: asset.inventoryCode,
          conflictingLoanNo: existingConflict.loan.loanNo,
        });
      }
    }

    return {
      isAvailable: conflicts.length === 0,
      conflicts,
    };
  }

  async createLoan(dto: CreateLoanDto) {
    const existing = await this.prisma.assetLoan.findUnique({
      where: { loanNo: dto.loanNo },
    });
    if (existing) {
      throw new ConflictException(`Nomor peminjaman ${dto.loanNo} sudah terdaftar`);
    }

    const availability = await this.checkAvailability(dto.assetItemIds, dto.startDate, dto.expectedReturnDate);
    if (!availability.isAvailable) {
      throw new ConflictException({
        message: "Sebagian aset yang dipilih memiliki jadwal peminjaman bentrok atau tidak tersedia",
        conflicts: availability.conflicts,
      });
    }

    const startDate = new Date(dto.startDate);
    const expectedReturnDate = new Date(dto.expectedReturnDate);

    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.assetLoan.create({
        data: {
          loanNo: dto.loanNo,
          borrowerType: dto.borrowerType,
          borrowerUserId: dto.borrowerUserId,
          borrowerName: dto.borrowerName,
          borrowerPhone: dto.borrowerPhone,
          borrowerIdCard: dto.borrowerIdCard,
          startDate,
          expectedReturnDate,
          purpose: dto.purpose,
          status: LoanStatus.PENDING,
        },
      });

      for (const assetId of dto.assetItemIds) {
        const asset = await tx.assetItem.findUnique({ where: { id: assetId } });
        if (!asset) continue;

        await tx.assetLoanItem.create({
          data: {
            loanId: loan.id,
            assetItemId: asset.id,
            conditionBefore: asset.condition,
          },
        });
      }

      return this.prisma.assetLoan.findUnique({
        where: { id: loan.id },
        include: {
          items: {
            include: { assetItem: { include: { item: true } } },
          },
        },
      });
    });
  }

  async getLoans() {
    return this.prisma.assetLoan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        borrowerUser: { select: { id: true, fullName: true, role: true } },
        approver: { select: { id: true, fullName: true } },
        items: {
          include: {
            assetItem: {
              include: { item: true, currentRoom: true },
            },
          },
        },
      },
    });
  }

  async verifyLoan(id: string, approve: boolean, approverId: string) {
    const loan = await this.prisma.assetLoan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!loan) {
      throw new NotFoundException("Transaksi peminjaman tidak ditemukan");
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException("Peminjaman ini sudah diverifikasi sebelumnya");
    }

    const newStatus = approve ? LoanStatus.ON_LOAN : LoanStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.assetLoan.update({
        where: { id },
        data: {
          status: newStatus,
          approvedBy: approverId,
        },
      });

      if (approve) {
        // Update all related asset items to BORROWED status
        for (const it of loan.items) {
          await tx.assetItem.update({
            where: { id: it.assetItemId },
            data: { status: AssetStatus.BORROWED },
          });
        }
      }

      return updatedLoan;
    });
  }

  async returnLoan(id: string, dto: ReturnLoanDto) {
    const loan = await this.prisma.assetLoan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!loan) {
      throw new NotFoundException("Peminjaman tidak ditemukan");
    }

    if (loan.status !== LoanStatus.ON_LOAN) {
      throw new BadRequestException("Aset belum dalam status dipinjam aktif");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.assetLoan.update({
        where: { id },
        data: {
          status: LoanStatus.RETURNED,
          actualReturnDate: new Date(),
          penaltyNotes: dto.penaltyNotes,
        },
      });

      for (const it of loan.items) {
        const itemCond = dto.itemConditions?.find((c) => c.assetItemId === it.assetItemId);
        const conditionAfter = itemCond?.conditionAfter || it.conditionBefore;

        await tx.assetLoanItem.update({
          where: { id: it.id },
          data: { conditionAfter },
        });

        // Set asset status back to AVAILABLE and update condition if changed
        await tx.assetItem.update({
          where: { id: it.assetItemId },
          data: {
            status: AssetStatus.AVAILABLE,
            condition: conditionAfter,
          },
        });
      }

      return updatedLoan;
    });
  }
}
