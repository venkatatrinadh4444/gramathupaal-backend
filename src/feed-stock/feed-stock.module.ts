import { Module } from '@nestjs/common';
import { FeedStockController } from './feed-stock.controller';
import { FeedStockService } from './feed-stock.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [FeedStockController],
  providers: [FeedStockService]
})
export class FeedStockModule {}
