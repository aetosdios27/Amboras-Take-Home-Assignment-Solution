import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { StoreEntity } from '../stores/store.entity';

export type EventType =
  | 'page_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'purchase';

@Entity('events')
@Index(['storeId', 'timestamp'])
@Index(['storeId', 'eventType', 'timestamp'])
@Index(['storeId', 'productId', 'timestamp'])
export class EventEntity {
  @PrimaryColumn({ type: 'varchar', name: 'event_id' })
  eventId: string;

  @Column({ type: 'varchar', name: 'store_id' })
  storeId: string;

  @ManyToOne(() => StoreEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: StoreEntity;

  @Column({ type: 'varchar', name: 'event_type' })
  eventType: EventType;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'varchar', name: 'product_id', nullable: true })
  productId: string | null;

  @Column({ type: 'numeric', nullable: true })
  amount: string | null;

  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;
}
