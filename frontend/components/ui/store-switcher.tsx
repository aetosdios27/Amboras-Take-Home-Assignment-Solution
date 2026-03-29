"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { STORES } from "@/lib/constants";

interface StoreSwitcherProps {
  storeId: string;
  onStoreChange: (id: string) => void;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function StoreSwitcher({ storeId, onStoreChange }: StoreSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);

  const currentStore =
    STORES.find((store) => store.id === storeId) ?? STORES[0];

  const filteredStores = STORES.filter((store) => {
    const needle = query.toLowerCase().trim();
    if (!needle) return true;

    return (
      store.name.toLowerCase().includes(needle) ||
      store.id.toLowerCase().includes(needle)
    );
  });

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-[240px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors",
          "border-zinc-800 bg-zinc-900 text-zinc-100 shadow-sm",
          "hover:border-zinc-700 hover:bg-zinc-900",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Store className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate">{currentStore.name}</span>
        </span>

        <ChevronsUpDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
          <div className="border-b border-zinc-800 p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores..."
              className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </div>

          <div
            role="listbox"
            className="max-h-72 overflow-y-auto p-1"
            aria-label="Stores"
          >
            {filteredStores.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-zinc-500">
                No store found.
              </div>
            ) : (
              filteredStores.map((store) => {
                const selected = store.id === storeId;

                return (
                  <button
                    key={store.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onStoreChange(store.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      selected
                        ? "bg-blue-500/10 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-800"
                    )}
                  >
                    <Store className="h-4 w-4 shrink-0 text-zinc-500" />

                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate">{store.name}</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {store.id}
                      </span>
                    </div>

                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-blue-400 transition-opacity",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
