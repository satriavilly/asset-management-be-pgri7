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
import { MaintenancesService } from "./maintenances.service";
import { ReportDamageDto, TriageMaintenanceDto } from "./dto/report-damage.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Maintenances")
@Controller("maintenances")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaintenancesController {
  constructor(private maintenancesService: MaintenancesService) {}

  @Post("report")
  @ApiOperation({ summary: "Lapor kerusakan fisik aset (+ foto kamera HP) oleh Guru/Staf" })
  reportDamage(
    @Body() dto: ReportDamageDto,
    @CurrentUser("id") reporterId: string,
  ) {
    return this.maintenancesService.reportDamage(dto, reporterId);
  }

  @Get()
  @ApiOperation({ summary: "Daftar seluruh laporan kerusakan & histori servis aset" })
  getMaintenances() {
    return this.maintenancesService.getMaintenances();
  }

  @Patch(":id/triage")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Triase penanganan kerusakan (Perbaikan Mandiri, Servis Vendor, atau Lempar ke Disposal)" })
  triageMaintenance(
    @Param("id") id: string,
    @Body() dto: TriageMaintenanceDto,
  ) {
    return this.maintenancesService.triageMaintenance(id, dto);
  }

  @Patch(":id/complete")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Konfirmasi perbaikan selesai + input realisasi biaya servis" })
  completeMaintenance(
    @Param("id") id: string,
    @Body("cost") cost?: number,
  ) {
    return this.maintenancesService.completeMaintenance(id, cost);
  }
}
