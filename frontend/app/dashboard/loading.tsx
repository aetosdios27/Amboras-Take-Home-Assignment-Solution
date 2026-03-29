import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-3">
        <Skeleton className="h-5 w-40 bg-zinc-800" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
            >
              <Skeleton className="h-3 w-24 bg-zinc-800 mb-4" />
              <Skeleton className="h-8 w-32 bg-zinc-800 mb-2" />
              <Skeleton className="h-3 w-20 bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <Skeleton className="h-64 w-full bg-zinc-800" />
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <Skeleton className="h-64 w-full bg-zinc-800" />
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
