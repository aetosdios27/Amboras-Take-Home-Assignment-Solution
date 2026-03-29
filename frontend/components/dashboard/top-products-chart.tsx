"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, truncateId } from "@/lib/format";
import type { TopProductsResponse } from "@/types/analytics";

interface TopProductsChartProps {
  data: TopProductsResponse | undefined;
  isLoading: boolean;
  error: Error | null;
}

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

export function TopProductsChart({
  data,
  isLoading,
  error,
}: TopProductsChartProps) {
  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <Skeleton className="h-4 w-32 bg-zinc-800" />
          <Skeleton className="h-3 w-48 bg-zinc-800" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-md bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-900/40 border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">Failed to load product data.</p>
        </CardContent>
      </Card>
    );
  }

  const products = data?.items ?? [];

  const chartData = products.map((p) => ({
    name: truncateId(p.product_id),
    revenue: p.revenue,
    purchase_count: p.purchase_count,
    revenue_share: p.revenue_share,
  }));

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium tracking-widest uppercase text-zinc-400">
          Top Products
        </CardTitle>
        <CardDescription className="text-xs text-zinc-600">
          By revenue — all time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-zinc-600">No purchase data yet.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                horizontal={false}
                stroke="hsl(240 3.7% 20%)"
                strokeDasharray="3 3"
              />
              <XAxis
                type="number"
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fontSize: 10, fill: "hsl(240 5% 40%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(240 3.7% 15%)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => [
                      <span key="val" className="font-mono tabular-nums">
                        {formatCurrency(Number(value))}
                        <span className="ml-2 text-xs text-zinc-500">
                          ({item.payload.purchase_count} purchases)
                        </span>
                      </span>,
                      "Revenue",
                    ]}
                  />
                }
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(217 91% ${62 - index * 4}%)`}
                  />
                ))}
                <LabelList
                  dataKey="revenue"
                  position="right"
                  formatter={(v: number) => formatCurrency(v)}
                  style={{ fontSize: 10, fill: "hsl(240 5% 50%)" }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
