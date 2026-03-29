import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventEntity } from '../events/event.entity';
import { DailyStoreMetricsEntity } from './entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from './entities/daily-product-metrics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      DailyStoreMetricsEntity,
      DailyProductMetricsEntity,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
