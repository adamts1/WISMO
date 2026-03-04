export interface TrackingInfo {
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  fulfillment_status: string | null;
  fulfillment_created_at: string | null;
}

export interface PendingItem {
  line_item_id: string | null;
  title: string | null;
  sku: string | null;
  remaining_qty: number;
  total_qty: number | null;
  fulfillment_order_status: string | null;
}

export interface ShopifyOrder {
  order_id: string;
  order_name: string;
  email: string;
  created_at: string;
  order_fulfillment_status: string;
  tracking: TrackingInfo[];
  pending_items: PendingItem[];
  shipping_address: {
    name: string;
    city: string;
    zip: string;
    countryCodeV2: string;
    address1: string;
  } | null;
}

export type OrderLookupType = 'name' | 'email' | 'zip';
