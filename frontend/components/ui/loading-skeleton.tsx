import { cn } from "@/lib/utils";

/**
 * Pulse skeleton for inline text replacement.
 * Usage: <TextSkeleton className="w-24" />
 */
export function TextSkeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 animate-pulse rounded bg-zinc-800",
        className
      )}
    />
  );
}

/**
 * Full-card skeleton — matches the KpiCard layout.
 */
export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-3">
      <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
      <div className="h-8 w-32 animate-pulse rounded bg-zinc-800" />
      <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
    </div>
  );
}

/**
 * Chart area skeleton.
 */
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={cn("w-full animate-pulse rounded-md bg-zinc-800", height)}
    />
  );
}

/**
 * Table row skeleton.
 */
export function RowSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 animate-pulse rounded bg-zinc-800",
            i === 0 ? "w-20" : i === cols - 1 ? "w-12" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}
