import { apiGet, apiPut } from "@/lib/api/client";
import type { Store, StoreUpdate } from "@/types/seller/store";

export function getStore(): Promise<Store> {
  return apiGet<Store>("/api/v1/seller/store");
}

export function updateStore(body: StoreUpdate): Promise<Store> {
  return apiPut<Store>("/api/v1/seller/store", body);
}
