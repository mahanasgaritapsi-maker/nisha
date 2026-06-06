import { apiGet } from "@/lib/api/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api/pagination";
import type { AdminOrderDetail, AdminOrderListItem, ListAdminOrdersParams } from "@/types/admin/order";

function buildQuery(params: ListAdminOrdersParams): string {
  const q = new URLSearchParams();
  if (params.store_id) q.set("store_id", String(params.store_id));
  if (params.status) q.set("status", params.status);
  if (params.date_from) q.set("date_from", params.date_from);
  if (params.date_to) q.set("date_to", params.date_to);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function listOrders(
  params: ListAdminOrdersParams = {},
): Promise<PaginatedResponse<AdminOrderListItem>> {
  return apiGet<PaginatedResponse<AdminOrderListItem>>(
    `/api/v1/admin/orders${buildQuery(params)}`,
  );
}

export function getOrder(id: number): Promise<AdminOrderDetail> {
  return apiGet<AdminOrderDetail>(`/api/v1/admin/orders/${id}`);
}
