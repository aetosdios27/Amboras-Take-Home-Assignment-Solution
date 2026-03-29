"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeTime, truncateId } from "@/lib/format";
import { EVENT_TYPE_BADGE_COLORS, EVENT_TYPE_LABELS } from "@/lib/constants";
import type { RecentActivityResponse, RecentEvent } from "@/types/analytics";

interface RecentActivityListProps {
  data: RecentActivityResponse | undefined;
  isLoading: boolean;
  error: Error | null;
}

function ActivityRow({ event }: { event: RecentEvent }) {
  const badgeClass =
    EVENT_TYPE_BADGE_COLORS[event.event_type] ?? "bg-zinc-700 text-zinc-400";
  const label = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;
  const isPurchase = event.event_type === "purchase";

  return (
    <li className="animate-in fade-in slide-in-from-top-1 flex items-center gap-3 border-b border-zinc-800/60 py-2 duration-300 last:border-0">
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${badgeClass}`}
      >
        {label}
      </span>

      <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">
        {event.product_id ? truncateId(event.product_id, 16) : "anonymous"}
        {isPurchase && event.amount != null && (
          <span className="ml-2 font-mono tabular-nums text-emerald-400">
            {formatCurrency(event.amount, event.currency ?? "USD")}
          </span>
        )}
      </span>

      <span className="shrink-0 font-mono tabular-nums text-[10px] text-zinc-600">
        {formatRelativeTime(event.timestamp)}
      </span>
    </li>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded bg-zinc-800" />
          <Skeleton className="h-3 flex-1 bg-zinc-800" />
          <Skeleton className="h-3 w-10 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function RecentActivityList({
  data,
  isLoading,
  error,
}: RecentActivityListProps) {
  const events = data?.items ?? [];

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <Skeleton className="h-4 w-32 bg-zinc-800" />
        </CardHeader>
        <CardContent>
          <ActivitySkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-900/40 border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">Failed to load activity feed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium tracking-widest uppercase text-zinc-400">
            Recent Activity
          </CardTitle>
          <CardDescription className="text-xs text-zinc-600">
            Last {events.length} events · refreshes every 10s
          </CardDescription>
        </div>

        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0">
        {events.length === 0 ? (
          <p className="py-4 text-sm text-zinc-600">No events yet.</p>
        ) : (
          <ScrollArea className="h-96">
            <ul>
              {events.map((event) => (
                <ActivityRow key={event.event_id} event={event} />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
