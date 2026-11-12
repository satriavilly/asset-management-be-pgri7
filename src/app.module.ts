import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { MasterModule } from "./modules/master/master.module";
import { ProcurementsModule } from "./modules/procurements/procurements.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { LoansModule } from "./modules/loans/loans.module";
import { MutationsModule } from "./modules/mutations/mutations.module";
import { MaintenancesModule } from "./modules/maintenances/maintenances.module";
import { AuditsModule } from "./modules/audits/audits.module";
import { DisposalsModule } from "./modules/disposals/disposals.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { TransformResponseInterceptor } from "./common/interceptors/transform-response.interceptor";
import { GlobalHttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MasterModule,
    ProcurementsModule,
    AssetsModule,
    LoansModule,
    MutationsModule,
    MaintenancesModule,
    AuditsModule,
    DisposalsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
