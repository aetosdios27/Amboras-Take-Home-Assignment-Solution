import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { UserEntity } from '../users/user.entity';
import { StoreEntity } from '../stores/store.entity';
import { EventEntity } from '../events/event.entity';
import { DailyStoreMetricsEntity } from '../analytics/entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from '../analytics/entities/daily-product-metrics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StoreEntity,
      EventEntity,
      DailyStoreMetricsEntity,
      DailyProductMetricsEntity,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
