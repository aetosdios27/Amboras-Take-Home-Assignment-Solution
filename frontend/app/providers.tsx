"use client";

import { SWRConfig } from "swr";

/**
 * Global SWR config:
 * - Retry 3 times on error with exponential backoff
 * - Don't retry on 4xx (auth errors shouldn't loop)
 * - Dedupe interval prevents hammering API on rapid re-renders
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 5_000,
        errorRetryCount: 3,
        errorRetryInterval: 3_000,
        shouldRetryOnError: (err) => {
          // Don't retry on client errors — they won't resolve themselves
          if (err?.status >= 400 && err?.status < 500) return false;
          return true;
        },
        onError: (err) => {
          // Hook into your error tracking here (Sentry, etc.)
          if (process.env.NODE_ENV === "development") {
            console.error("[SWR Error]", err);
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
