import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('stores')
export class StoreEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;
}
