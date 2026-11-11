import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProcurementsService } from "./procurements.service";
import { CreateProcurementDto } from "./dto/create-procurement.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Procurements")
@Controller("procurements")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProcurementsController {
  constructor(private procurementsService: ProcurementsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Buat transaksi pengadaan baru + auto-generate fisik aset & kode inventaris" })
  createProcurement(
    @Body() dto: CreateProcurementDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.procurementsService.createProcurement(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: "Ambil seluruh daftar histori transaksi pengadaan" })
  getProcurements() {
    return this.procurementsService.getProcurements();
  }

  @Get(":id")
  @ApiOperation({ summary: "Ambil rincian detail faktur pengadaan & daftar aset yang dihasilkan" })
  getProcurementById(@Param("id") id: string) {
    return this.procurementsService.getProcurementById(id);
  }
}
