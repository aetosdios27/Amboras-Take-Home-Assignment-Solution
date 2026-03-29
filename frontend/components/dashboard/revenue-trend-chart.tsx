"use client";

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
}

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

function synthesiseTrend(weekRevenue: number, todayRevenue: number) {
  const priorTotal = Math.max(weekRevenue - todayRevenue, 0);

  const weights = [0.12, 0.18, 0.14, 0.16, 0.15, 0.25];
  const days = weights.map((w, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      revenue: Math.round(w * priorTotal),
    };
  });

  const today = new Date();
  days.push({
    date: today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    revenue: Math.round(todayRevenue),
  });

  return days;
}

export function RevenueTrendChart({
  overview,
  isLoading,
}: RevenueTrendChartProps) {
  if (isLoading || !overview) {
    return (
      <SectionCard title="Revenue Trend" description="Last 7 days">
        <Skeleton className="h-48 w-full rounded-md bg-zinc-800" />
      </SectionCard>
    );
  }

  const data = synthesiseTrend(overview.revenue.week, overview.revenue.today);
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <SectionCard
      title="Revenue Trend"
      description="Last 7 days · synthesised from weekly aggregate"
    >
      <ChartContainer config={chartConfig} className="h-48 w-full">
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
            tickFormatter={(val, i) =>
              i === 0 || i === data.length - 1 ? val.split(",")[0] : ""
            }
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
