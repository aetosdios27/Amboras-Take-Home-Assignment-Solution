"use client";

import useSWR from "swr";
import { analyticsService } from "@/services/analytics";
import {
  POLL_INTERVAL_ACTIVITY,
  POLL_INTERVAL_OVERVIEW,
} from "@/lib/constants";

/**
 * Each section fetches independently.
 * One endpoint failing does NOT cascade — the rest of the dashboard stays up.
 * SWR handles deduplication, revalidation, and error retries automatically.
 */
export function useDashboardData(storeId: string | null) {
  const enabled = Boolean(storeId);

  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
    isValidating: overviewRefreshing,
  } = useSWR(
    enabled ? ["overview", storeId] : null,
    ([, id]) => analyticsService.getOverview(id!),
    {
      refreshInterval: POLL_INTERVAL_OVERVIEW,
      revalidateOnFocus: false,
    }
  );

  const {
    data: topProducts,
    error: topProductsError,
    isLoading: topProductsLoading,
  } = useSWR(
    enabled ? ["top-products", storeId] : null,
    ([, id]) => analyticsService.getTopProducts(id!),
    {
      refreshInterval: POLL_INTERVAL_OVERVIEW,
      revalidateOnFocus: false,
    }
  );

  const {
    data: recentActivity,
    error: recentActivityError,
    isLoading: recentActivityLoading,
  } = useSWR(
    enabled ? ["recent-activity", storeId] : null,
    ([, id]) => analyticsService.getRecentActivity(id!),
    {
      refreshInterval: POLL_INTERVAL_ACTIVITY,
      revalidateOnFocus: true, // snap to latest when tab refocused
    }
  );

  return {
    overview,
    topProducts,
    recentActivity,
    isLoading: overviewLoading || topProductsLoading || recentActivityLoading,
    isRefreshing: overviewRefreshing,
    errors: {
      overview: overviewError ?? null,
      topProducts: topProductsError ?? null,
      recentActivity: recentActivityError ?? null,
    },
  } as const;
}
