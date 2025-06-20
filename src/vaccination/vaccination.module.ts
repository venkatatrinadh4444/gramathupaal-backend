import { Module } from '@nestjs/common';
import { VaccinationController } from './vaccination.controller';
import { VaccinationService } from './vaccination.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [VaccinationController],
  providers: [VaccinationService]
})
export class VaccinationModule {}
