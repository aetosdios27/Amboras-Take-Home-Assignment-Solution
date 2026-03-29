"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to your error tracking service here (Sentry, etc.)
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-sm text-center space-y-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Dashboard failed to load
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {error.message ?? "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-[10px] text-zinc-700">
              Digest: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}
