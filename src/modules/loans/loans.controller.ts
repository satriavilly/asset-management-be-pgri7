import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { LoansService } from "./loans.service";
import { CreateLoanDto, ReturnLoanDto } from "./dto/create-loan.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Loans")
@Controller("loans")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoansController {
  constructor(private loansService: LoansService) {}

  @Get("check-availability")
  @ApiOperation({ summary: "Pemeriksaan ketersediaan aset & deteksi bentrok jadwal peminjaman" })
  @ApiQuery({ name: "assetItemIds", type: [String], description: "ID fisik AssetItem" })
  @ApiQuery({ name: "startDate", example: "2026-11-15" })
  @ApiQuery({ name: "expectedReturnDate", example: "2026-11-17" })
  checkAvailability(
    @Query("assetItemIds") assetItemIds: string | string[],
    @Query("startDate") startDate: string,
    @Query("expectedReturnDate") expectedReturnDate: string,
  ) {
    const ids = Array.isArray(assetItemIds) ? assetItemIds : [assetItemIds];
    return this.loansService.checkAvailability(ids, startDate, expectedReturnDate);
  }

  @Post()
  @ApiOperation({ summary: "Ajukan permohonan peminjaman aset (Guru, Eksternal, Sarpras)" })
  createLoan(@Body() dto: CreateLoanDto) {
    return this.loansService.createLoan(dto);
  }

  @Get()
  @ApiOperation({ summary: "Daftar seluruh riwayat transaksi peminjaman aset" })
  getLoans() {
    return this.loansService.getLoans();
  }

  @Patch(":id/verify")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Verifikasi persetujuan peminjaman & serah terima fisik (Sarpras)" })
  verifyLoan(
    @Param("id") id: string,
    @Body("approve") approve: boolean,
    @CurrentUser("id") approverId: string,
  ) {
    return this.loansService.verifyLoan(id, approve, approverId);
  }

  @Patch(":id/return")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Pengembalian aset, pengecekan kelengkapan & pencatatan denda sanksi" })
  returnLoan(
    @Param("id") id: string,
    @Body() dto: ReturnLoanDto,
  ) {
    return this.loansService.returnLoan(id, dto);
  }
}
