import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { Roles } from "@/common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("User Management")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Daftar seluruh akun pengguna (Admin & Sarpras)" })
  @ApiQuery({ name: "role", enum: UserRole, required: false })
  getUsers(@Query("role") role?: UserRole) {
    return this.usersService.getUsers(role);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SARPRAS)
  @ApiOperation({ summary: "Detail akun pengguna & ruangan yang diampunya" })
  getUserById(@Param("id") id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(":id/toggle-active")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Aktifkan / Nonaktifkan status akun (Khusus Admin)" })
  toggleUserActive(@Param("id") id: string) {
    return this.usersService.toggleUserActive(id);
  }
}
