import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AnimalModule } from './animal/animal.module';
import { CheckupModule } from './checkup/checkup.module';
import { MilkModule } from './milk/milk.module';
import { FeedStockModule } from './feed-stock/feed-stock.module';
import { FeedManagementModule } from './feed-management/feed-management.module';
import { VaccinationModule } from './vaccination/vaccination.module';
import { EmployeeModule } from './employee/employee.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true
    }),
    PrismaModule, AuthModule,UserModule,AnimalModule,MilkModule,FeedStockModule,FeedManagementModule,CheckupModule, VaccinationModule, EmployeeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
