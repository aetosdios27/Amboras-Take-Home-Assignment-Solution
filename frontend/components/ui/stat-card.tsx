import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: Trend;
  delta?: string; // e.g. "+12.4%"
  icon?: React.ReactNode;
  className?: string;
}

const trendConfig: Record<Trend, { color: string; Icon: React.ElementType }> = {
  up: { color: "text-emerald-400", Icon: TrendingUp },
  down: { color: "text-red-400", Icon: TrendingDown },
  neutral: { color: "text-zinc-500", Icon: Minus },
};

export function StatCard({
  label,
  value,
  sub,
  trend = "neutral",
  delta,
  icon,
  className,
}: StatCardProps) {
  const { color, Icon } = trendConfig[trend];

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>

      {/* Value */}
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-zinc-50">
        {value}
      </p>

      {/* Delta / sub */}
      <div className="mt-1.5 flex items-center gap-1.5">
        {delta && (
          <>
            <Icon className={cn("h-3 w-3", color)} />
            <span className={cn("text-xs font-medium tabular-nums", color)}>
              {delta}
            </span>
          </>
        )}
        {sub && <span className="text-xs text-zinc-500">{sub}</span>}
      </div>
    </div>
  );
}
