import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('daily_store_metrics')
@Index(['storeId', 'date'], { unique: true })
export class DailyStoreMetricsEntity {
  @PrimaryColumn({ type: 'varchar', name: 'store_id' })
  storeId: string;

  @PrimaryColumn({ type: 'date' })
  date: string;

  @Column({ type: 'integer', default: 0, name: 'page_views' })
  pageViews: number;

  @Column({ type: 'integer', default: 0, name: 'add_to_cart' })
  addToCart: number;

  @Column({ type: 'integer', default: 0, name: 'remove_from_cart' })
  removeFromCart: number;

  @Column({ type: 'integer', default: 0, name: 'checkout_started' })
  checkoutStarted: number;

  @Column({ type: 'integer', default: 0, name: 'purchases' })
  purchases: number;

  @Column({ type: 'numeric', default: 0 })
  revenue: string;
}
