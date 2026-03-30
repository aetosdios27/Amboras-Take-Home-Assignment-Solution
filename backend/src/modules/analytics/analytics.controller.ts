import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../../common/decorators/current-user.decorator';
import { OverviewQueryDto } from './dto/overview-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { RecentActivityQueryDto } from './dto/recent-activity-query.dto';
import { IngestEventDto } from './dto/ingest-event.dto';

@Controller('/api/v1/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('/ingest')
  async ingestEvent(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: IngestEventDto,
  ) {
    return this.analyticsService.ingestEvent(user.storeId, dto);
  }

  @Get('/overview')
  async getOverview(
    @CurrentUser() user: CurrentUserType,
    @Query() query: OverviewQueryDto,
  ) {
    return this.analyticsService.getOverview(
      user.storeId,
      query.from,
      query.to,
    );
  }

  @Get('/top-products')
  async getTopProducts(
    @CurrentUser() user: CurrentUserType,
    @Query() query: TopProductsQueryDto,
  ) {
    return this.analyticsService.getTopProducts(
      user.storeId,
      query.from,
      query.to,
    );
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

  @Get('/live-visitors')
  async getLiveVisitors(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getLiveVisitors(user.storeId);
  }
}
