"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { analyticsService } from "@/services/analytics";
import type { LiveVisitorsResponse } from "@/services/analytics";
import { POLL_INTERVAL_OVERVIEW } from "@/lib/constants";
import { useSocket } from "./use-socket";

export interface ActivityItem {
  event_id: string;
  event_type: string;
  timestamp: Date;
  product_id: string | null;
  amount: number | null;
  currency: string | null;
}

export function useDashboardData(
  storeId: string | null,
  from?: string,
  to?: string
) {
  const enabled = Boolean(storeId);
  const { socketRef, isConnected } = useSocket(storeId);

  // ─── Activity state ────────────────────────────────────────────────────────
  const [recentActivity, setRecentActivity] = useState<ActivityItem[] | null>(
    null
  );
  const [activityError, setActivityError] = useState<Error | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // ─── Live visitors state ───────────────────────────────────────────────────
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitorsResponse | null>(
    null
  );

  // ─── Seed both on mount / storeId change ──────────────────────────────────
  useEffect(() => {
    if (!storeId) return;

    setRecentActivity(null);
    setLiveVisitors(null);
    setActivityLoading(true);
    setActivityError(null);

    Promise.allSettled([
      analyticsService.getRecentActivity(storeId),
      analyticsService.getLiveVisitors(storeId),
    ]).then(([activityResult, visitorsResult]) => {
      if (activityResult.status === "fulfilled") {
        setRecentActivity(activityResult.value?.items ?? []);
      } else {
        setActivityError(activityResult.reason as Error);
      }

      if (visitorsResult.status === "fulfilled") {
        setLiveVisitors(visitorsResult.value);
      }

      setActivityLoading(false);
    });
  }, [storeId]);

  // ─── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const handleActivity = (event: ActivityItem) => {
      setRecentActivity((prev) => {
        if (!prev) return [event];
        if (prev.some((e) => e.event_id === event.event_id)) return prev;
        return [event, ...prev].slice(0, 50);
      });
    };

    const handleVisitors = (data: LiveVisitorsResponse) => {
      setLiveVisitors(data);
    };

    socket.on("activity:new", handleActivity);
    socket.on("visitors:update", handleVisitors);

    return () => {
      socket.off("activity:new", handleActivity);
      socket.off("visitors:update", handleVisitors);
    };
  }, [socketRef, isConnected]);

  // ─── Overview — SWR with date range ───────────────────────────────────────
  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
    isValidating: overviewRefreshing,
  } = useSWR(
    enabled ? ["overview", storeId, from ?? null, to ?? null] : null,
    ([, id, f, t]: [string, string, string | null, string | null]) =>
      analyticsService.getOverview(id!, f ?? undefined, t ?? undefined),
    {
      refreshInterval: POLL_INTERVAL_OVERVIEW,
      revalidateOnFocus: false,
    }
  );

  // ─── Top products — SWR with date range ───────────────────────────────────
  const {
    data: topProducts,
    error: topProductsError,
    isLoading: topProductsLoading,
  } = useSWR(
    enabled ? ["top-products", storeId, from ?? null, to ?? null] : null,
    ([, id, f, t]: [string, string, string | null, string | null]) =>
      analyticsService.getTopProducts(id!, f ?? undefined, t ?? undefined),
    {
      refreshInterval: POLL_INTERVAL_OVERVIEW,
      revalidateOnFocus: false,
    }
  );

  return {
    overview,
    topProducts,
    recentActivity,
    liveVisitors,
    isConnected,
    isLoading: overviewLoading || topProductsLoading || activityLoading,
    isRefreshing: overviewRefreshing,
    errors: {
      overview: overviewError ?? null,
      topProducts: topProductsError ?? null,
      recentActivity: activityError,
    },
  } as const;
}
