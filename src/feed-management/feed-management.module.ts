import { Module } from '@nestjs/common';
import { FeedManagementController } from './feed-management.controller';
import { FeedManagementService } from './feed-management.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [FeedManagementController],
  providers: [FeedManagementService]
})
export class FeedManagementModule {}
