import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/public.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@ApiTags("Health")
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "API root info" })
  getRoot() {
    return {
      name: "SMP PGRI 7 Bandung — Asset Management API",
      version: "1.0.0",
      docs: "/api/docs",
      health: "/api/v1/health",
    };
  }

  @Public()
  @Get("health")
  @ApiOperation({ summary: "Public health check for API and PostgreSQL connection" })
  async getHealth() {
    let database = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }

    return {
      status: database ? "ok" : "degraded",
      database,
      environment: process.env.NODE_ENV || "development",
    };
  }
}
