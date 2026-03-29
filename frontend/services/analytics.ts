import { apiFetch } from "@/lib/api";
import type {
  AnalyticsOverview,
  TopProductsResponse,
  RecentActivityResponse,
} from "@/types/analytics";

export const analyticsService = {
  getOverview: (storeId: string) =>
    apiFetch<AnalyticsOverview>("/api/v1/analytics/overview", {
      headers: { "x-store-id": storeId },
    }),

  getTopProducts: (storeId: string) =>
    apiFetch<TopProductsResponse>("/api/v1/analytics/top-products", {
      headers: { "x-store-id": storeId },
    }),

  getRecentActivity: (storeId: string) =>
    apiFetch<RecentActivityResponse>("/api/v1/analytics/recent-activity", {
      headers: { "x-store-id": storeId },
    }),
};
