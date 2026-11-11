import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { Response } from "express";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@ApiTags("Dashboard & Reports")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get("dashboard/executive")
  @ApiOperation({ summary: "Metrik ringkasan eksekutif postur aset sekolah (Tampilan Khusus Kepala Sekolah / C-Level - Read Only)" })
  getExecutiveDashboard() {
    return this.reportsService.getExecutiveDashboard();
  }

  @Get("reports/buku-induk/excel")
  @ApiOperation({ summary: "Ekspor Buku Induk Inventaris lengkap ke format Microsoft Excel (.xlsx)" })
  exportBukuIndukExcel(@Res() res: Response) {
    return this.reportsService.exportBukuIndukExcel(res);
  }

  @Get("reports/dir/:roomId")
  @ApiOperation({ summary: "Ambil lembar Daftar Inventaris Ruangan (DIR) per ruangan" })
  getDirReport(@Param("roomId") roomId: string) {
    return this.reportsService.getDirReport(roomId);
  }
}
