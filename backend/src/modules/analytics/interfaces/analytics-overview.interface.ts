export interface AnalyticsOverview {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  events: {
    page_view: number;
    add_to_cart: number;
    remove_from_cart: number;
    checkout_started: number;
    purchase: number;
  };
  conversion_rate: number;
  funnel: {
    page_views: number;
    add_to_cart: number;
    checkout_started: number;
    purchases: number;
    view_to_cart_rate: number;
    cart_to_checkout_rate: number;
    checkout_to_purchase_rate: number;
  };
}
