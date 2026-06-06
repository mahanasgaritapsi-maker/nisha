import { apiRequest } from "@/lib/api/client";

export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: formData,
    auth: false,
  });
}
