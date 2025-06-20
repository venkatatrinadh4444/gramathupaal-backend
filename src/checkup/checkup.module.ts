import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CheckupController } from './checkup.controller';
import { CheckupService } from './checkup.service';

@Module({
    imports:[AuthModule],
    controllers:[CheckupController],
    providers:[CheckupService]
})
export class CheckupModule {}
