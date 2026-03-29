import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EventEntity } from '../events/event.entity';
import { StoreEntity } from '../stores/store.entity';
import { UserEntity } from '../users/user.entity';
import { DailyStoreMetricsEntity } from '../analytics/entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from '../analytics/entities/daily-product-metrics.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || 'store_analytics',
  entities: [
    UserEntity,
    StoreEntity,
    EventEntity,
    DailyStoreMetricsEntity,
    DailyProductMetricsEntity,
  ],
  synchronize: true,
  logging: false,
};
