import type { OrderStatus } from "@/types/order";
import type { PaymentMethod } from "@/types/seller/payment-method";
import type {
  OrderStatusHistory,
  PaymentProof,
  SellerOrderItem,
} from "@/types/seller/order";

export type AdminOrderListItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  total_amount: string;
  store_id: number;
  store_name: string;
  store_slug: string;
  created_at: string;
};

export type AdminOrderDetail = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note: string | null;
  subtotal_amount: string;
  total_amount: string;
  stock_restored: boolean;
  store_id: number;
  store_name: string;
  store_slug: string;
  created_at: string;
  updated_at: string;
  items: SellerOrderItem[];
  payment_method: PaymentMethod;
  payment_proofs: PaymentProof[];
  status_history: OrderStatusHistory[];
};

export type ListAdminOrdersParams = {
  store_id?: number;
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
};
