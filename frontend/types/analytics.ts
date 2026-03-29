export type EventType =
  | "page_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "purchase";

export interface RevenueMetrics {
  today: number;
  week: number;
  month: number;
}

export interface EventCounts {
  page_view: number;
  add_to_cart: number;
  remove_from_cart: number;
  checkout_started: number;
  purchase: number;
}

export interface FunnelMetrics {
  page_views: number;
  add_to_cart: number;
  checkout_started: number;
  purchases: number;
  view_to_cart_rate: number;
  cart_to_checkout_rate: number;
  checkout_to_purchase_rate: number;
}

export interface AnalyticsOverview {
  revenue: RevenueMetrics;
  events: EventCounts;
  conversion_rate: number;
  funnel: FunnelMetrics;
}

export interface TopProduct {
  product_id: string;
  revenue: number;
  purchase_count: number;
  revenue_share: number;
}

export interface TopProductsResponse {
  items: TopProduct[];
}

export interface RecentEvent {
  event_id: string;
  event_type: EventType;
  timestamp: string;
  product_id: string | null;
  amount: number | null;
  currency: string | null;
}

export interface RecentActivityResponse {
  items: RecentEvent[];
}

export interface FunnelStep {
  name: string;
  event_type: EventType;
  count: number;
  drop_off_rate: number | null;
}
