import { Module } from "@nestjs/common";
import { ProcurementsController } from "./procurements.controller";
import { ProcurementsService } from "./procurements.service";

@Module({
  controllers: [ProcurementsController],
  providers: [ProcurementsService],
  exports: [ProcurementsService],
})
export class ProcurementsModule {}
