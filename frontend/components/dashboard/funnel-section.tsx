"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, formatPercent } from "@/lib/format";
import { EVENT_TYPE_LABELS, FUNNEL_STEPS } from "@/lib/constants";
import type { AnalyticsOverview, FunnelStep } from "@/types/analytics";

interface FunnelSectionProps {
  overview: AnalyticsOverview | undefined;
  isLoading: boolean;
  error: Error | null;
}

function buildFunnelSteps(overview: AnalyticsOverview): FunnelStep[] {
  const counts = overview.events;

  return FUNNEL_STEPS.map((eventType, i) => {
    const count = counts[eventType] ?? 0;
    const prevCount = i === 0 ? null : counts[FUNNEL_STEPS[i - 1]] ?? 0;
    const drop_off_rate =
      prevCount !== null && prevCount > 0 ? 1 - count / prevCount : null;

    return {
      name: EVENT_TYPE_LABELS[eventType],
      event_type: eventType,
      count,
      drop_off_rate,
    };
  });
}

function FunnelBar({
  step,
  maxCount,
  index,
}: {
  step: FunnelStep;
  maxCount: number;
  index: number;
}) {
  const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;

  const barColors = [
    "bg-blue-500",
    "bg-blue-400",
    "bg-amber-400",
    "bg-emerald-500",
  ];

  return (
    <div className="group">
      {step.drop_off_rate !== null && (
        <div className="mb-1 flex items-center gap-2 pl-2">
          <div className="h-px flex-1 border-t border-dashed border-zinc-800" />
          <span className="text-[10px] text-red-400 tabular-nums">
            ↓ {formatPercent(step.drop_off_rate, 0)} drop-off
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="w-5 shrink-0 text-right text-xs font-mono text-zinc-600">
          {index + 1}
        </span>

        <div className="relative flex-1">
          <div className="h-7 w-full rounded bg-zinc-800/60" />
          <div
            className={`absolute inset-y-0 left-0 rounded ${barColors[index]} opacity-80 transition-all duration-700`}
            style={{ width: `${widthPct}%` }}
          />
          <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-white/90">
            {step.name}
          </span>
        </div>

        <span className="w-16 shrink-0 text-right text-sm font-mono tabular-nums text-zinc-300">
          {formatCompact(step.count)}
        </span>
      </div>
    </div>
  );
}

export function FunnelSection({
  overview,
  isLoading,
  error,
}: FunnelSectionProps) {
  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <Skeleton className="h-4 w-40 bg-zinc-800" />
          <Skeleton className="h-3 w-56 bg-zinc-800" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full bg-zinc-800 rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !overview) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 border-red-900/40">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">Failed to load funnel data.</p>
        </CardContent>
      </Card>
    );
  }

  const steps = buildFunnelSteps(overview);
  const maxCount = steps[0]?.count ?? 1;

  const overallConversion =
    steps[0].count > 0 ? steps[steps.length - 1].count / steps[0].count : 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium tracking-widest uppercase text-zinc-400">
              Conversion Funnel
            </CardTitle>
            <CardDescription className="text-zinc-600 text-xs">
              Customer journey — all time
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums text-emerald-400">
              {formatPercent(overallConversion, 1)}
            </p>
            <p className="text-[10px] text-zinc-600">overall conversion</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, i) => (
          <FunnelBar
            key={step.event_type}
            step={step}
            maxCount={maxCount}
            index={i}
          />
        ))}
      </CardContent>
    </Card>
  );
}
