export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const POLL_INTERVAL_OVERVIEW = 30_000; // 30s
export const POLL_INTERVAL_ACTIVITY = 10_000; // 10s — "live" feel

export const EVENT_TYPE_LABELS: Record<string, string> = {
  page_view: "Page View",
  add_to_cart: "Add to Cart",
  remove_from_cart: "Removed from Cart",
  checkout_started: "Checkout Started",
  purchase: "Purchase",
};

// Tailwind classes — kept in sync with globals.css chart vars
export const EVENT_TYPE_BADGE_COLORS: Record<string, string> = {
  page_view: "bg-zinc-700 text-zinc-300",
  add_to_cart: "bg-blue-500/20 text-blue-400",
  remove_from_cart: "bg-red-500/20 text-red-400",
  checkout_started: "bg-amber-500/20 text-amber-400",
  purchase: "bg-emerald-500/20 text-emerald-400",
};

// Funnel order — matches the customer journey
export const FUNNEL_STEPS = [
  "page_view",
  "add_to_cart",
  "checkout_started",
  "purchase",
] as const;

export const STORES: { id: string; name: string }[] = [
  { id: "store_1", name: "Store 1" },
  { id: "store_2", name: "Store 2" },
  { id: "store_3", name: "Store 3" },
  { id: "store_4", name: "Store 4" },
  { id: "store_5", name: "Store 5" },
];
