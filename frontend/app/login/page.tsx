"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Loader2 } from "lucide-react";
import { STORES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [selectedStore, setSelectedStore] = useState(STORES[0].id);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const userId = selectedStore.replace("store_", "user_");

    localStorage.setItem("storeId", selectedStore);
    localStorage.setItem("userId", userId);

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(217 91% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 60%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5">
            <BarChart2 className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-semibold tracking-tight text-zinc-100">
              Amboras
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Store Analytics Dashboard
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl shadow-black/50">
          <h2 className="mb-6 text-sm font-medium tracking-widest uppercase text-zinc-400">
            Select your store
          </h2>

          <div className="space-y-3">
            {STORES.map((store) => (
              <label
                key={store.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                  selectedStore === store.id
                    ? "border-blue-500/50 bg-blue-500/10 text-zinc-100"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="store"
                  value={store.id}
                  checked={selectedStore === store.id}
                  onChange={() => setSelectedStore(store.id)}
                  className="sr-only"
                />
                <span
                  className={`h-2 w-2 rounded-full ${
                    selectedStore === store.id ? "bg-blue-500" : "bg-zinc-700"
                  }`}
                />
                <span className="text-sm font-medium">{store.name}</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-600">
                  {store.id}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Enter Dashboard"
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-zinc-700">
          Mock auth — no password required in dev
        </p>
      </div>
    </div>
  );
}
