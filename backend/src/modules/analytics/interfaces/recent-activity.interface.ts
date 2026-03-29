export interface RecentActivityItem {
  event_id: string;
  event_type: string;
  timestamp: Date;
  product_id: string | null;
  amount: number | null;
  currency: string | null;
}
