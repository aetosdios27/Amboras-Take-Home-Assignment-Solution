import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EventEntity } from '../events/event.entity';
import { DailyStoreMetricsEntity } from './entities/daily-store-metrics.entity';
import { DailyProductMetricsEntity } from './entities/daily-product-metrics.entity';
import { AnalyticsOverview } from './interfaces/analytics-overview.interface';
import { TopProduct } from './interfaces/top-product.interface';
import { RecentActivityItem } from './interfaces/recent-activity.interface';
import { roundMoney, roundRatio, safeDivide } from './analytics.utils';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,

    @InjectRepository(DailyStoreMetricsEntity)
    private readonly dailyStoreMetricsRepo: Repository<DailyStoreMetricsEntity>,

    @InjectRepository(DailyProductMetricsEntity)
    private readonly dailyProductMetricsRepo: Repository<DailyProductMetricsEntity>,
  ) {}

  async getOverview(storeId: string): Promise<AnalyticsOverview> {
    const today = new Date();
    const todayStr = this.toDateString(today);

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayRows, weekRows, monthRows] = await Promise.all([
      this.dailyStoreMetricsRepo.find({
        where: { storeId, date: todayStr },
      }),
      this.dailyStoreMetricsRepo.find({
        where: {
          storeId,
          date: Between(this.toDateString(weekAgo), todayStr),
        },
      }),
      this.dailyStoreMetricsRepo.find({
        where: {
          storeId,
          date: Between(this.toDateString(monthStart), todayStr),
        },
      }),
    ]);

    const todayAgg = this.aggregateStoreMetrics(todayRows);
    const weekAgg = this.aggregateStoreMetrics(weekRows);
    const monthAgg = this.aggregateStoreMetrics(monthRows);

    const pageViews = monthAgg.pageViews;
    const purchases = monthAgg.purchases;
    const addToCart = monthAgg.addToCart;
    const checkoutStarted = monthAgg.checkoutStarted;

    return {
      revenue: {
        today: roundMoney(todayAgg.revenue),
        week: roundMoney(weekAgg.revenue),
        month: roundMoney(monthAgg.revenue),
      },
      events: {
        page_view: monthAgg.pageViews,
        add_to_cart: monthAgg.addToCart,
        remove_from_cart: monthAgg.removeFromCart,
        checkout_started: monthAgg.checkoutStarted,
        purchase: monthAgg.purchases,
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
    };
  }

  async getTopProducts(storeId: string): Promise<{ items: TopProduct[] }> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const rows = await this.dailyProductMetricsRepo.find({
      where: {
        storeId,
        date: Between(this.toDateString(monthStart), this.toDateString(today)),
      },
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

    return { items };
  }

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
