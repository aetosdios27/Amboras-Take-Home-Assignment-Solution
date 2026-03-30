import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsGateway } from './analytics.gateway';
import { AuthModule } from '../auth/auth.module';
import { EventEntity } from '../events/event.entity';
import { DailyStoreMetricsEntity } from './entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from './entities/daily-product-metrics.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      EventEntity,
      DailyStoreMetricsEntity,
      DailyProductMetricsEntity,
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        ttl: 60,
      }),
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsGateway],
  exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule {}
