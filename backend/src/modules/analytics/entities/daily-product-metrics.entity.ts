import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('daily_product_metrics')
@Index(['storeId', 'date', 'productId'], { unique: true })
export class DailyProductMetricsEntity {
  @PrimaryColumn({ type: 'varchar', name: 'store_id' })
  storeId: string;

  @PrimaryColumn({ type: 'date' })
  date: string;

  @PrimaryColumn({ type: 'varchar', name: 'product_id' })
  productId: string;

  @Column({ type: 'integer', default: 0, name: 'purchase_count' })
  purchaseCount: number;

  @Column({ type: 'numeric', default: 0 })
  revenue: string;
}
