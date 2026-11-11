import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DisposalsService } from "./disposals.service";
import { CreateDisposalDto } from "./dto/create-disposal.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Disposals")
@Controller("disposals")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DisposalsController {
  constructor(private disposalsService: DisposalsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Pencatatan pemusnahan aset (Berita Acara & 2 saksi resmi) & soft-delete" })
  createDisposal(
    @Body() dto: CreateDisposalDto,
    @CurrentUser("id") executorId: string,
  ) {
    return this.disposalsService.createDisposal(dto, executorId);
  }

  @Get()
  @ApiOperation({ summary: "Daftar histori seluruh aset yang dimusnahkan/dihapus dari buku induk" })
  getDisposals() {
    return this.disposalsService.getDisposals();
  }

  @Get(":id")
  @ApiOperation({ summary: "Detail Berita Acara Pemusnahan Aset & identitas para saksi" })
  getDisposalById(@Param("id") id: string) {
    return this.disposalsService.getDisposalById(id);
  }
}
