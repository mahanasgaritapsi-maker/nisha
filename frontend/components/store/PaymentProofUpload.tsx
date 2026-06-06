"use client";

import { useState, type FormEvent } from "react";
import * as ordersApi from "@/lib/api/public/orders";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PaymentProofUploadProps = {
  invoiceCode: string;
  defaultPassword?: string;
  onSuccess?: () => void;
};

export function PaymentProofUpload({
  invoiceCode,
  defaultPassword = "",
  onSuccess,
}: PaymentProofUploadProps) {
  const toast = useToast();
  const [password, setPassword] = useState(defaultPassword);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Please select an image file.");
      return;
    }
    if (!password.trim()) {
      setError("Invoice password is required.");
      return;
    }
    setLoading(true);
    try {
      await ordersApi.uploadPaymentProof(invoiceCode, password.trim(), file);
      toast.success("Payment proof uploaded. The seller will review and confirm your payment.");
      setFile(null);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-semibold text-neutral-900">Upload payment proof</h3>
      <p className="text-sm text-neutral-600">
        Upload a screenshot or photo of your payment. The seller will confirm once verified.
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <Input
        label="Invoice password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Image file</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </div>
      <Button type="submit" loading={loading} disabled={!file}>
        Upload proof
      </Button>
    </form>
  );
}
