import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { StoreEntity } from '../stores/store.entity';
import { EventEntity, EventType } from '../events/event.entity';
import { DailyStoreMetricsEntity } from '../analytics/entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from '../analytics/entities/daily-product-metrics.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(StoreEntity)
    private readonly storeRepo: Repository<StoreEntity>,

    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,

    @InjectRepository(DailyStoreMetricsEntity)
    private readonly dailyStoreMetricsRepo: Repository<DailyStoreMetricsEntity>,

    @InjectRepository(DailyProductMetricsEntity)
    private readonly dailyProductMetricsRepo: Repository<DailyProductMetricsEntity>,
  ) {}

  async seed() {
    console.log('Resetting database tables...');

    await this.eventRepo.query(`
      TRUNCATE TABLE
        events,
        daily_product_metrics,
        daily_store_metrics,
        users,
        stores
      RESTART IDENTITY CASCADE;
    `);

    const stores: StoreEntity[] = [];
    const users: UserEntity[] = [];
    const events: EventEntity[] = [];

    const productIds = Array.from({ length: 40 }).map(
      (_, i) => `prod_${i + 1}`,
    );

    console.log('Generating stores, users, and events...');

    for (let s = 1; s <= 5; s++) {
      const storeId = `store_${s}`;

      const store = this.storeRepo.create({
        id: storeId,
        name: `Store ${s}`,
      });
      stores.push(store);

      const user = this.userRepo.create({
        id: `user_${s}`,
        email: `owner${s}@example.com`,
        storeId,
      });
      users.push(user);

      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - dayOffset);

        // realistic funnel
        const pageViews = this.randomInt(150, 600);
        const addToCart = Math.floor(pageViews * this.randomFloat(0.08, 0.18));
        const removeFromCart = Math.floor(
          addToCart * this.randomFloat(0.1, 0.25),
        );
        const checkoutStarted = Math.floor(
          addToCart * this.randomFloat(0.4, 0.7),
        );
        const purchases = Math.floor(
          checkoutStarted * this.randomFloat(0.25, 0.45),
        );

        this.pushEvents(
          events,
          storeId,
          'page_view',
          pageViews,
          baseDate,
          productIds,
        );
        this.pushEvents(
          events,
          storeId,
          'add_to_cart',
          addToCart,
          baseDate,
          productIds,
        );
        this.pushEvents(
          events,
          storeId,
          'remove_from_cart',
          removeFromCart,
          baseDate,
          productIds,
        );
        this.pushEvents(
          events,
          storeId,
          'checkout_started',
          checkoutStarted,
          baseDate,
          productIds,
        );
        this.pushPurchaseEvents(
          events,
          storeId,
          purchases,
          baseDate,
          productIds,
        );
      }
    }

    console.log(`Saving ${stores.length} stores...`);
    await this.saveInChunks(this.storeRepo, stores, 100);

    console.log(`Saving ${users.length} users...`);
    await this.saveInChunks(this.userRepo, users, 100);

    console.log(`Saving ${events.length} events...`);
    await this.saveInChunks(this.eventRepo, events, 1000);

    console.log('Building rollups...');
    await this.buildRollups(events);

    console.log('Seed complete');
    console.log('Use headers like: x-user-id=user_1, x-store-id=store_1');
  }

  private async buildRollups(events: EventEntity[]) {
    const storeMap = new Map<string, DailyStoreMetricsEntity>();
    const productMap = new Map<string, DailyProductMetricsEntity>();

    for (const event of events) {
      const date = event.timestamp.toISOString().slice(0, 10);
      const storeKey = `${event.storeId}:${date}`;

      if (!storeMap.has(storeKey)) {
        storeMap.set(
          storeKey,
          this.dailyStoreMetricsRepo.create({
            storeId: event.storeId,
            date,
            pageViews: 0,
            addToCart: 0,
            removeFromCart: 0,
            checkoutStarted: 0,
            purchases: 0,
            revenue: '0',
          }),
        );
      }

      const storeMetric = storeMap.get(storeKey)!;

      switch (event.eventType) {
        case 'page_view':
          storeMetric.pageViews += 1;
          break;
        case 'add_to_cart':
          storeMetric.addToCart += 1;
          break;
        case 'remove_from_cart':
          storeMetric.removeFromCart += 1;
          break;
        case 'checkout_started':
          storeMetric.checkoutStarted += 1;
          break;
        case 'purchase':
          storeMetric.purchases += 1;
          storeMetric.revenue = String(
            Number(storeMetric.revenue) + Number(event.amount || 0),
          );
          break;
      }

      if (event.eventType === 'purchase' && event.productId) {
        const productKey = `${event.storeId}:${date}:${event.productId}`;

        if (!productMap.has(productKey)) {
          productMap.set(
            productKey,
            this.dailyProductMetricsRepo.create({
              storeId: event.storeId,
              date,
              productId: event.productId,
              purchaseCount: 0,
              revenue: '0',
            }),
          );
        }

        const productMetric = productMap.get(productKey)!;
        productMetric.purchaseCount += 1;
        productMetric.revenue = String(
          Number(productMetric.revenue) + Number(event.amount || 0),
        );
      }
    }

    const storeMetrics = Array.from(storeMap.values());
    const productMetrics = Array.from(productMap.values());

    console.log(`Saving ${storeMetrics.length} daily store metrics...`);
    await this.saveInChunks(this.dailyStoreMetricsRepo, storeMetrics, 500);

    console.log(`Saving ${productMetrics.length} daily product metrics...`);
    await this.saveInChunks(this.dailyProductMetricsRepo, productMetrics, 500);
  }

  private async saveInChunks<T extends object>(
    repo: Repository<T>,
    rows: T[],
    chunkSize = 1000,
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await repo.save(chunk);
      console.log(
        `Saved ${Math.min(i + chunk.length, rows.length)}/${rows.length} rows`,
      );
    }
  }

  private pushEvents(
    target: EventEntity[],
    storeId: string,
    eventType: EventType,
    count: number,
    baseDate: Date,
    productIds: string[],
  ) {
    for (let i = 0; i < count; i++) {
      target.push(
        this.eventRepo.create({
          eventId: crypto.randomUUID(),
          storeId,
          eventType,
          timestamp: this.randomTimeOnDate(baseDate),
          productId: productIds[this.randomInt(0, productIds.length - 1)],
          amount: null,
          currency: null,
          data: {},
        }),
      );
    }
  }

  private pushPurchaseEvents(
    target: EventEntity[],
    storeId: string,
    count: number,
    baseDate: Date,
    productIds: string[],
  ) {
    for (let i = 0; i < count; i++) {
      target.push(
        this.eventRepo.create({
          eventId: crypto.randomUUID(),
          storeId,
          eventType: 'purchase',
          timestamp: this.randomTimeOnDate(baseDate),
          productId: productIds[this.randomInt(0, productIds.length - 1)],
          amount: String(this.randomFloat(12.99, 199.99).toFixed(2)),
          currency: 'USD',
          data: {},
        }),
      );
    }
  }

  private randomTimeOnDate(date: Date): Date {
    const d = new Date(date);
    d.setHours(this.randomInt(0, 23));
    d.setMinutes(this.randomInt(0, 59));
    d.setSeconds(this.randomInt(0, 59));
    d.setMilliseconds(0);
    return d;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
