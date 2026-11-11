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
import { MutationsService } from "./mutations.service";
import { CreateMutationDto } from "./dto/create-mutation.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Mutations")
@Controller("mutations")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MutationsController {
  constructor(private mutationsService: MutationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SARPRAS, UserRole.GURU)
  @ApiOperation({ summary: "Ajukan permohonan mutasi aset antar ruangan (Guru / Sarpras)" })
  createMutation(
    @Body() dto: CreateMutationDto,
    @CurrentUser("id") proposerId: string,
  ) {
    return this.mutationsService.createMutation(dto, proposerId);
  }

  @Get()
  @ApiOperation({ summary: "Daftar seluruh permohonan & histori mutasi ruangan" })
  getMutations() {
    return this.mutationsService.getMutations();
  }

  @Patch(":id/review")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Persetujuan mutasi ruangan (Sarpras) & update otomatis lokasi aset" })
  reviewMutation(
    @Param("id") id: string,
    @Body("approve") approve: boolean,
    @CurrentUser("id") approverId: string,
  ) {
    return this.mutationsService.reviewMutation(id, approve, approverId);
  }
}
