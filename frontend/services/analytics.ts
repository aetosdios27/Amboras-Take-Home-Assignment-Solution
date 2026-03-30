import { apiFetch } from "@/lib/api";
import type {
  AnalyticsOverview,
  TopProductsResponse,
  RecentActivityResponse,
} from "@/types/analytics";

export interface LiveVisitorsResponse {
  count: number;
  active_products: string[];
}

export const analyticsService = {
  getOverview: (storeId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.size ? `?${params.toString()}` : "";
    return apiFetch<AnalyticsOverview>(`/api/v1/analytics/overview${qs}`, {
      headers: { "x-store-id": storeId },
    });
  },

  getTopProducts: (storeId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.size ? `?${params.toString()}` : "";
    return apiFetch<TopProductsResponse>(
      `/api/v1/analytics/top-products${qs}`,
      {
        headers: { "x-store-id": storeId },
      }
    );
  },

  getRecentActivity: (storeId: string) =>
    apiFetch<RecentActivityResponse>("/api/v1/analytics/recent-activity", {
      headers: { "x-store-id": storeId },
    }),

  getLiveVisitors: (storeId: string) =>
    apiFetch<LiveVisitorsResponse>("/api/v1/analytics/live-visitors", {
      headers: { "x-store-id": storeId },
    }),
};
