import { apiPatch, apiPost } from "@/lib/api/client";
import { apiPostForm } from "@/lib/api/upload";
import type {
  GuestOrderEdit,
  GuestOrderEditResponse,
  OrderTrackRequest,
  OrderTrackResponse,
  PaymentProofUploadResponse,
} from "@/types/public/order";

export function trackOrder(body: OrderTrackRequest): Promise<OrderTrackResponse> {
  return apiPost<OrderTrackResponse>("/api/v1/public/orders/track", body, { auth: false });
}

export function uploadPaymentProof(
  invoiceCode: string,
  invoiceEditPassword: string,
  file: File,
): Promise<PaymentProofUploadResponse> {
  const formData = new FormData();
  formData.append("invoice_edit_password", invoiceEditPassword);
  formData.append("file", file);
  return apiPostForm<PaymentProofUploadResponse>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/upload-payment-proof`,
    formData,
  );
}

export function editOrder(
  invoiceCode: string,
  body: GuestOrderEdit,
): Promise<GuestOrderEditResponse> {
  return apiPatch<GuestOrderEditResponse>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/edit`,
    body,
    { auth: false },
  );
}
