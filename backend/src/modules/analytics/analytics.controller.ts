import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MockAuthGuard } from '../../common/guards/mock-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../../common/decorators/current-user.decorator';
import { OverviewQueryDto } from './dto/overview-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { RecentActivityQueryDto } from './dto/recent-activity-query.dto';

@Controller('/api/v1/analytics')
@UseGuards(MockAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('/overview')
  async getOverview(
    @CurrentUser() user: CurrentUserType,
    @Query() _query: OverviewQueryDto,
  ) {
    return this.analyticsService.getOverview(user.storeId);
  }

  @Get('/top-products')
  async getTopProducts(
    @CurrentUser() user: CurrentUserType,
    @Query() _query: TopProductsQueryDto,
  ) {
    return this.analyticsService.getTopProducts(user.storeId);
  }

  @Get('/recent-activity')
  async getRecentActivity(
    @CurrentUser() user: CurrentUserType,
    @Query() query: RecentActivityQueryDto,
  ) {
    return this.analyticsService.getRecentActivity(
      user.storeId,
      query.limit ?? 20,
    );
  }
}
