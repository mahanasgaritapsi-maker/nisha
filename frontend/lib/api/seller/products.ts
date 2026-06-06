import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api/pagination";
import type { Product, ProductCreate, ProductUpdate } from "@/types/seller/product";

export function listProducts(
  params: PaginationParams = {},
): Promise<PaginatedResponse<Product>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const query = q.toString();
  return apiGet<PaginatedResponse<Product>>(
    `/api/v1/seller/products${query ? `?${query}` : ""}`,
  );
}

export function getProduct(id: number): Promise<Product> {
  return apiGet<Product>(`/api/v1/seller/products/${id}`);
}

export function createProduct(body: ProductCreate): Promise<Product> {
  return apiPost<Product>("/api/v1/seller/products", body);
}

export function updateProduct(id: number, body: ProductUpdate): Promise<Product> {
  return apiPut<Product>(`/api/v1/seller/products/${id}`, body);
}

export function deleteProduct(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/products/${id}`);
}
