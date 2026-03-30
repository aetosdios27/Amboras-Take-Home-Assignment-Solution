import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Between, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { EventEntity } from '../events/event.entity';
import type { EventType } from '../events/event.entity';
import { DailyStoreMetricsEntity } from './entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from './entities/daily-product-metrics.entity';
import { AnalyticsGateway } from './analytics.gateway';
import { IngestEventDto } from './dto/ingest-event.dto';
import { AnalyticsOverview } from './interfaces/analytics-overview.interface';
import { TopProduct } from './interfaces/top-product.interface';
import { RecentActivityItem } from './interfaces/recent-activity.interface';
import { roundMoney, roundRatio, safeDivide } from './analytics.utils';

const CACHE_TTL_OVERVIEW = 60;
const CACHE_TTL_TOP_PRODUCTS = 60;
const CACHE_TTL_LIVE_VISITORS = 10;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,

    @InjectRepository(DailyStoreMetricsEntity)
    private readonly dailyStoreMetricsRepo: Repository<DailyStoreMetricsEntity>,

    @InjectRepository(DailyProductMetricsEntity)
    private readonly dailyProductMetricsRepo: Repository<DailyProductMetricsEntity>,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,

    private readonly gateway: AnalyticsGateway,
  ) {}

  // ─── Ingest ────────────────────────────────────────────────────────────────

  async ingestEvent(
    storeId: string,
    dto: IngestEventDto,
  ): Promise<{ event_id: string }> {
    const event = this.eventRepo.create({
      eventId: randomUUID(),
      storeId,
      eventType: dto.eventType as EventType,
      productId: dto.productId ?? null,
      amount: dto.amount ?? null, // stays string — matches entity column
      currency: dto.currency ?? null,
      timestamp: new Date(),
    });

    // Explicit cast: save(single entity) returns EventEntity, but TS picks the array overload
    const saved = (await this.eventRepo.save(event)) as EventEntity;

    this.gateway.pushActivityUpdate(storeId, {
      event_id: saved.eventId,
      event_type: saved.eventType,
      timestamp: saved.timestamp,
      product_id: saved.productId ?? null,
      amount: saved.amount != null ? roundMoney(Number(saved.amount)) : null,
      currency: saved.currency ?? null,
    });

    await this.invalidateCacheForStore(storeId);

    if (dto.eventType === 'page_view') {
      const visitors = await this.getLiveVisitors(storeId);
      this.gateway.pushLiveVisitorsUpdate(
        storeId,
        visitors.count,
        visitors.active_products,
      );
    }

    return { event_id: saved.eventId };
  }

  // ─── Overview ──────────────────────────────────────────────────────────────

  async getOverview(
    storeId: string,
    from?: string,
    to?: string,
  ): Promise<AnalyticsOverview> {
    const cacheKey = `overview:${storeId}:${from ?? 'default'}:${to ?? 'default'}`;
    const cached = await this.cache.get<AnalyticsOverview>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    const todayStr = this.toDateString(today);

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const rangeFrom = from ?? this.toDateString(monthStart);
    const rangeTo = to ?? todayStr;

    const [todayRows, weekRows, rangeRows] = await Promise.all([
      this.dailyStoreMetricsRepo.find({ where: { storeId, date: todayStr } }),
      this.dailyStoreMetricsRepo.find({
        where: { storeId, date: Between(this.toDateString(weekAgo), todayStr) },
      }),
      this.dailyStoreMetricsRepo.find({
        where: { storeId, date: Between(rangeFrom, rangeTo) },
      }),
    ]);

    const todayAgg = this.aggregateStoreMetrics(todayRows);
    const weekAgg = this.aggregateStoreMetrics(weekRows);
    const rangeAgg = this.aggregateStoreMetrics(rangeRows);

    const { pageViews, purchases, addToCart, checkoutStarted } = rangeAgg;

    const result: AnalyticsOverview = {
      revenue: {
        today: roundMoney(todayAgg.revenue),
        week: roundMoney(weekAgg.revenue),
        month: roundMoney(rangeAgg.revenue),
      },
      events: {
        page_view: rangeAgg.pageViews,
        add_to_cart: rangeAgg.addToCart,
        remove_from_cart: rangeAgg.removeFromCart,
        checkout_started: rangeAgg.checkoutStarted,
        purchase: rangeAgg.purchases,
      },
      conversion_rate: roundRatio(safeDivide(purchases, pageViews)),
      funnel: {
        page_views: pageViews,
        add_to_cart: addToCart,
        checkout_started: checkoutStarted,
        purchases,
        view_to_cart_rate: roundRatio(safeDivide(addToCart, pageViews)),
        cart_to_checkout_rate: roundRatio(
          safeDivide(checkoutStarted, addToCart),
        ),
        checkout_to_purchase_rate: roundRatio(
          safeDivide(purchases, checkoutStarted),
        ),
      },
      generated_at: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL_OVERVIEW);
    return result;
  }

  // ─── Top Products ──────────────────────────────────────────────────────────

  async getTopProducts(
    storeId: string,
    from?: string,
    to?: string,
  ): Promise<{ items: TopProduct[] }> {
    const cacheKey = `top-products:${storeId}:${from ?? 'default'}:${to ?? 'default'}`;
    const cached = await this.cache.get<{ items: TopProduct[] }>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const rangeFrom = from ?? this.toDateString(monthStart);
    const rangeTo = to ?? this.toDateString(today);

    const rows = await this.dailyProductMetricsRepo.find({
      where: { storeId, date: Between(rangeFrom, rangeTo) },
    });

    const productMap = new Map<
      string,
      { revenue: number; purchaseCount: number }
    >();

    for (const row of rows) {
      const existing = productMap.get(row.productId) || {
        revenue: 0,
        purchaseCount: 0,
      };
      existing.revenue += Number(row.revenue);
      existing.purchaseCount += row.purchaseCount;
      productMap.set(row.productId, existing);
    }

    const totalRevenue = Array.from(productMap.values()).reduce(
      (sum, item) => sum + item.revenue,
      0,
    );

    const items = Array.from(productMap.entries())
      .map(([productId, value]) => ({
        product_id: productId,
        revenue: roundMoney(value.revenue),
        purchase_count: value.purchaseCount,
        revenue_share: roundRatio(
          totalRevenue > 0 ? value.revenue / totalRevenue : 0,
        ),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const result = { items };
    await this.cache.set(cacheKey, result, CACHE_TTL_TOP_PRODUCTS);
    return result;
  }

  // ─── Recent Activity ───────────────────────────────────────────────────────

  async getRecentActivity(
    storeId: string,
    limit = 20,
  ): Promise<{ items: RecentActivityItem[] }> {
    const rows = await this.eventRepo.find({
      where: { storeId },
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return {
      items: rows.map((row) => ({
        event_id: row.eventId,
        event_type: row.eventType,
        timestamp: row.timestamp,
        product_id: row.productId,
        amount: row.amount ? roundMoney(Number(row.amount)) : null,
        currency: row.currency,
      })),
    };
  }

  // ─── Live Visitors ─────────────────────────────────────────────────────────

  async getLiveVisitors(
    storeId: string,
  ): Promise<{ count: number; active_products: string[] }> {
    const cacheKey = `live-visitors:${storeId}`;
    const cached = await this.cache.get<{
      count: number;
      active_products: string[];
    }>(cacheKey);
    if (cached) return cached;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const rows = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.productId', 'productId')
      .where('e.storeId = :storeId', { storeId })
      .andWhere('e.eventType = :type', { type: 'page_view' })
      .andWhere('e.timestamp >= :since', { since: fiveMinutesAgo })
      .andWhere('e.productId IS NOT NULL')
      .distinct(true)
      .getRawMany();

    const active_products = rows.map((r) => r.productId).filter(Boolean);
    const result = { count: active_products.length, active_products };

    await this.cache.set(cacheKey, result, CACHE_TTL_LIVE_VISITORS);
    return result;
  }

  // ─── Cache Invalidation ────────────────────────────────────────────────────

  async invalidateCacheForStore(storeId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`overview:${storeId}:default:default`),
      this.cache.del(`top-products:${storeId}:default:default`),
      this.cache.del(`live-visitors:${storeId}`),
    ]);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private aggregateStoreMetrics(rows: DailyStoreMetricsEntity[]) {
    return rows.reduce(
      (acc, row) => {
        acc.pageViews += row.pageViews;
        acc.addToCart += row.addToCart;
        acc.removeFromCart += row.removeFromCart;
        acc.checkoutStarted += row.checkoutStarted;
        acc.purchases += row.purchases;
        acc.revenue += Number(row.revenue);
        return acc;
      },
      {
        pageViews: 0,
        addToCart: 0,
        removeFromCart: 0,
        checkoutStarted: 0,
        purchases: 0,
        revenue: 0,
      },
    );
  }

  private toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
