"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LogOut, BarChart2 } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { FunnelSection } from "@/components/dashboard/funnel-section";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { StoreSwitcher } from "@/components/ui/store-switcher";
import { STORES } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedStoreId = localStorage.getItem("storeId");
    const savedUserId = localStorage.getItem("userId");

    if (!savedStoreId || !savedUserId) {
      router.replace("/login");
      return;
    }

    setStoreId(savedStoreId);
    setReady(true);
  }, [router]);

  const handleStoreChange = (newStoreId: string) => {
    const newUserId = newStoreId.replace("store_", "user_");

    localStorage.setItem("storeId", newStoreId);
    localStorage.setItem("userId", newUserId);
    setStoreId(newStoreId);
  };

  const handleLogout = () => {
    localStorage.removeItem("storeId");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  const {
    overview,
    topProducts,
    recentActivity,
    isLoading,
    isRefreshing,
    errors,
  } = useDashboardData(storeId);

  const currentStore = STORES.find((s) => s.id === storeId);

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <p className="text-sm text-zinc-500">Loading dashboard…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Amboras
            </span>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">
              {currentStore?.name ?? "—"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isRefreshing && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-600" />
            )}

            {storeId && (
              <StoreSwitcher
                storeId={storeId}
                onStoreChange={handleStoreChange}
              />
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Store Analytics
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Auto-refreshes every 30s. Activity feed every 10s.
          </p>
        </div>

        <section aria-label="Key metrics">
          <KpiCards overview={overview} isLoading={isLoading} />
        </section>

        <section aria-label="Revenue trend">
          <RevenueTrendChart overview={overview} isLoading={isLoading} />
        </section>

        <section
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          aria-label="Charts"
        >
          <TopProductsChart
            data={topProducts}
            isLoading={isLoading}
            error={errors.topProducts}
          />
          <FunnelSection
            overview={overview}
            isLoading={isLoading}
            error={errors.overview}
          />
        </section>

        <section aria-label="Recent activity">
          <RecentActivityList
            data={recentActivity}
            isLoading={isLoading}
            error={errors.recentActivity}
          />
        </section>

        <footer className="border-t border-zinc-800/60 pt-4">
          <p className="text-[10px] tabular-nums text-zinc-700">
            {"generated_at" in (overview ?? {}) && overview?.generated_at
              ? `Data as of ${new Date(
                  overview.generated_at
                ).toLocaleTimeString()}`
              : "Live data"}
          </p>
        </footer>
      </main>
    </div>
  );
}
