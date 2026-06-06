import { apiGet, apiPatch } from "@/lib/api/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api/pagination";
import type { AdminStoreActionResponse, AdminStoreListItem } from "@/types/admin/store";

export function listStores(
  params: PaginationParams = {},
): Promise<PaginatedResponse<AdminStoreListItem>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const query = q.toString();
  return apiGet<PaginatedResponse<AdminStoreListItem>>(
    `/api/v1/admin/stores${query ? `?${query}` : ""}`,
  );
}

export function activateStore(storeId: number): Promise<AdminStoreActionResponse> {
  return apiPatch<AdminStoreActionResponse>(`/api/v1/admin/stores/${storeId}/activate`);
}

export function deactivateStore(storeId: number): Promise<AdminStoreActionResponse> {
  return apiPatch<AdminStoreActionResponse>(`/api/v1/admin/stores/${storeId}/deactivate`);
}
