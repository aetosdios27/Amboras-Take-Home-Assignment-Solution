"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  parseISO,
  subDays,
  format as fnsFormat,
} from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SectionCard } from "@/components/dashboard/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { AnalyticsOverview } from "@/types/analytics";

interface RevenueTrendChartProps {
  overview: AnalyticsOverview | undefined;
  isLoading: boolean;
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd
}

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

/**
 * Build an array of { date, revenue } points distributed across the
 * selected date range.  We only have `revenue.week` + `revenue.today`
 * as aggregates, so we synthesise plausible daily values using a
 * seeded-random-ish weight spread.
 *
 * Now range-aware: labels and bucket count match the actual selection.
 */
function synthesiseTrend(
  weekRevenue: number,
  todayRevenue: number,
  from?: string,
  to?: string
) {
  const endDate = to ? parseISO(to) : new Date();
  const startDate = from ? parseISO(from) : subDays(endDate, 6);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // If range is a single day, just return that day
  if (days.length <= 1) {
    return [
      {
        date: fnsFormat(endDate, "EEE, MMM d"),
        revenue: Math.round(todayRevenue || weekRevenue),
      },
    ];
  }

  // Distribute "prior" revenue across all days except the last,
  // last day gets todayRevenue.
  const priorTotal = Math.max(weekRevenue - todayRevenue, 0);
  const priorDays = days.length - 1;

  // Vary weights so the line isn't flat
  const weights = days.slice(0, priorDays).map((_, i) => {
    // simple deterministic wave
    return 1 + 0.4 * Math.sin(((i * 2.3) % priorDays) + 0.7);
  });
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;

  const points = days.map((d, i) => {
    const isLast = i === days.length - 1;
    return {
      date: fnsFormat(d, "EEE, MMM d"),
      revenue: isLast
        ? Math.round(todayRevenue)
        : Math.round((weights[i] / wSum) * priorTotal),
    };
  });

  return points;
}

export function RevenueTrendChart({
  overview,
  isLoading,
  from,
  to,
}: RevenueTrendChartProps) {
  const data = useMemo(() => {
    if (!overview) return [];
    return synthesiseTrend(
      overview.revenue.week,
      overview.revenue.today,
      from,
      to
    );
  }, [overview, from, to]);

  if (isLoading || !overview) {
    return (
      <SectionCard title="Revenue Trend" description="Selected range">
        <Skeleton className="h-48 w-full rounded-md bg-zinc-800" />
      </SectionCard>
    );
  }

  const max = Math.max(...data.map((d) => d.revenue), 1);

  // Decide how many tick labels to show so they don't overlap
  const tickInterval = data.length <= 7 ? 0 : Math.ceil(data.length / 7) - 1;

  return (
    <SectionCard
      title="Revenue Trend"
      description={`${data.length} day${
        data.length === 1 ? "" : "s"
      } · synthesised from aggregates`}
    >
      {/* key on data length + totals so Recharts fully re-mounts on change */}
      <ChartContainer
        key={`${data.length}-${overview.revenue.week}-${overview.revenue.today}`}
        config={chartConfig}
        className="h-48 w-full"
      >
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(217 91% 60%)"
                stopOpacity={0.3}
              />
              <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="hsl(240 3.7% 15%)"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(240 5% 40%)" }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />

          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fontSize: 10, fill: "hsl(240 5% 40%)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, max * 1.15]}
            width={68}
          />

          <ChartTooltip
            cursor={{ stroke: "hsl(240 3.7% 22%)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                formatter={(value) => [
                  <span key="v" className="font-mono tabular-nums">
                    {formatCurrency(Number(value))}
                  </span>,
                  "Revenue",
                ]}
              />
            }
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "hsl(217 91% 60%)",
              stroke: "hsl(240 10% 6%)",
            }}
          />
        </AreaChart>
      </ChartContainer>
    </SectionCard>
  );
}
