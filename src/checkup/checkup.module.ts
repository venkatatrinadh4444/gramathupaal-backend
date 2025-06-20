import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CheckupController } from './checkup.controller';
import { CheckupService } from './checkup.service';

@Module({
    imports:[AuthModule],
    controllers:[CheckupController],
    providers:[CheckupService]
})
export class CheckupModule {}
