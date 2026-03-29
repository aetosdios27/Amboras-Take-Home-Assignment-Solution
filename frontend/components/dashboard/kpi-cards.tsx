"use client";

import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AnalyticsOverview } from "@/types/analytics";

interface KpiCardsProps {
  overview: AnalyticsOverview | undefined;
  isLoading: boolean;
}

interface KpiCardDef {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}

function KpiCardSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <Skeleton className="h-3.5 w-24 bg-zinc-800" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 bg-zinc-800 mb-2" />
        <Skeleton className="h-3 w-20 bg-zinc-800" />
      </CardContent>
    </Card>
  );
}

function KpiCard({ title, value, sub, icon, trend, trendLabel }: KpiCardDef) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-red-400"
      : "text-zinc-400";

  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium tracking-widest uppercase text-zinc-500">
          {title}
        </CardTitle>
        <span className="text-zinc-600">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight tabular-nums text-zinc-50">
          {value}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
          {trend && trend !== "neutral" && (
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          )}
          <span className={trendLabel ? trendColor : ""}>{sub}</span>
        </p>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ overview, isLoading }: KpiCardsProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { revenue, conversion_rate, events } = overview;

  const weekDailyAvg = revenue.week / 7;
  const monthDailyAvg = revenue.month / 30;
  const todayVsWeekAvg = revenue.today > weekDailyAvg ? "up" : "down";

  const cards: KpiCardDef[] = [
    {
      title: "Revenue today",
      value: formatCurrency(revenue.today),
      sub: `${formatCurrency(weekDailyAvg)} daily avg this week`,
      icon: <DollarSign className="h-4 w-4" />,
      trend: todayVsWeekAvg,
    },
    {
      title: "Revenue this week",
      value: formatCurrency(revenue.week),
      sub: `${formatCurrency(revenue.week / 7)} / day avg`,
      icon: <DollarSign className="h-4 w-4" />,
      trend: "neutral",
    },
    {
      title: "Revenue this month",
      value: formatCurrency(revenue.month),
      sub: `${formatCurrency(monthDailyAvg)} / day avg`,
      icon: <DollarSign className="h-4 w-4" />,
      trend: "neutral",
    },
    {
      title: "Conversion rate",
      value: formatPercent(conversion_rate),
      sub: `${events.purchase.toLocaleString()} purchases / ${events.page_view.toLocaleString()} views`,
      icon: <Percent className="h-4 w-4" />,
      trend:
        conversion_rate > 0.03
          ? "up"
          : conversion_rate < 0.01
          ? "down"
          : "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}
