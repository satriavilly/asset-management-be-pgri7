import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuditsService } from "./audits.service";
import { CreateAuditSessionDto, ScanAuditItemDto } from "./dto/create-audit-session.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Stock Opname & Audits")
@Controller("audits")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditsController {
  constructor(private auditsService: AuditsService) {}

  @Post("sessions")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Buka sesi jadwal pemeriksaan fisik / stock opname berkala baru (Sarpras)" })
  createSession(
    @Body() dto: CreateAuditSessionDto,
    @CurrentUser("id") auditorId: string,
  ) {
    return this.auditsService.createSession(dto, auditorId);
  }

  @Get("sessions")
  @ApiOperation({ summary: "Daftar seluruh riwayat sesi audit stock opname tahunan/semester" })
  getSessions() {
    return this.auditsService.getSessions();
  }

  @Post("sessions/:id/scan")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Kirim data hasil scan QR Code fisik aset di ruangan secara realtime" })
  scanItem(
    @Param("id") sessionId: string,
    @Body() dto: ScanAuditItemDto,
  ) {
    return this.auditsService.scanItem(sessionId, dto);
  }

  @Get("sessions/:id/reconciliation")
  @ApiOperation({ summary: "Kalkulasi selisih rekonsiliasi audit (Aset Cocok, Salah Ruang, & Belum Ditemukan)" })
  getReconciliation(@Param("id") sessionId: string) {
    return this.auditsService.getReconciliation(sessionId);
  }

  @Patch("sessions/:id/close")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Tutup sesi audit fisik & sahkan rekonsiliasi data" })
  closeSession(@Param("id") sessionId: string) {
    return this.auditsService.closeSession(sessionId);
  }
}
