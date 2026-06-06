"use client";

import { use, useState } from "react";
import * as ordersApi from "@/lib/api/public/orders";
import { ApiError } from "@/lib/api/errors";
import { InvoiceView } from "@/components/invoice/InvoiceView";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { OrderTrackResponse } from "@/types/public/order";

type PageProps = {
  params: Promise<{ invoiceCode: string }>;
};

export default function InvoicePage({ params }: PageProps) {
  const { invoiceCode } = use(params);
  const [password, setPassword] = useState("");
  const [order, setOrder] = useState<OrderTrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await ordersApi.trackOrder({
        invoice_code: invoiceCode,
        invoice_edit_password: password,
      });
      setOrder(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!order ? (
        <Card className="print:hidden">
          <CardContent className="py-6">
            <h1 className="text-xl font-bold text-neutral-900">View invoice</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Invoice <span className="font-mono">{invoiceCode}</span>
            </p>
            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
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
              <Button type="submit" loading={loading}>
                View invoice
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex justify-end gap-3 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
          <InvoiceView order={order} />
        </>
      )}
    </main>
  );
}
