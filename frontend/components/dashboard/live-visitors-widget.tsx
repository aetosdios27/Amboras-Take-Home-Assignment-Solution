import { Activity } from "lucide-react";

interface LiveVisitorsWidgetProps {
  count: number | null;
  activeProducts: string[];
  isConnected: boolean;
}

export function LiveVisitorsWidget({
  count,
  activeProducts,
  isConnected,
}: LiveVisitorsWidgetProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">
            Live Visitors
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
            }`}
          />
          <span className="text-[10px] text-zinc-500">
            {isConnected ? "live" : "connecting…"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <span className="text-3xl font-semibold tabular-nums text-zinc-100">
          {count ?? "—"}
        </span>
        <span className="mb-1 text-xs text-zinc-500">active in last 5 min</span>
      </div>

      {activeProducts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeProducts.slice(0, 8).map((id) => (
            <span
              key={id}
              className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
            >
              {id}
            </span>
          ))}
          {activeProducts.length > 8 && (
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
              +{activeProducts.length - 8} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
