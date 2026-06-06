import type { OrderStatus } from "@/types/order";

export type LowStockProductItem = {
  id: number;
  title: string;
  stock_quantity: number;
  price: string;
};

export type RecentOrderItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  total_amount: string;
  created_at: string;
};

export type SellerDashboardResponse = {
  total_orders: number;
  pending_orders: number;
  payment_uploaded_orders: number;
  confirmed_orders: number;
  confirmed_revenue: string;
  pending_revenue: string;
  today_revenue: string;
  low_stock_products: LowStockProductItem[];
  recent_orders: RecentOrderItem[];
};
