"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as storesApi from "@/lib/api/public/stores";
import { useCart } from "@/contexts/CartContext";
import { ApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import { publicPaths } from "@/lib/paths/public";
import { useToast } from "@/contexts/ToastContext";
import { OrderSuccessPanel } from "@/components/store/OrderSuccessPanel";
import { PaymentMethodSelector } from "@/components/store/PaymentMethodSelector";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Textarea } from "@/components/ui/Textarea";
import type { CheckoutResponse } from "@/types/public/checkout";
import type { PublicPaymentMethod } from "@/types/public/store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CheckoutPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { items, subtotal, clearCart, reconcileWithProducts } = useCart();

  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PublicPaymentMethod[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<CheckoutResponse | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

  useEffect(() => {
    if (successOrder) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const store = await storesApi.getStoreBySlug(slug);
        if (cancelled) return;
        reconcileWithProducts(store.products);
        setPaymentMethods(store.payment_methods);
        if (store.payment_methods.length > 0) {
          setPaymentMethodId(store.payment_methods[0].id);
        }
      } catch {
        if (!cancelled) setError("Could not load store.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, reconcileWithProducts, successOrder]);

  useEffect(() => {
    if (!loading && !successOrder && items.length === 0) {
      router.replace(publicPaths.store(slug));
    }
  }, [loading, items.length, router, slug, successOrder]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!paymentMethodId) {
      setError("Please select a payment method.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await storesApi.createGuestOrder(slug, {
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: buyerAddress.trim(),
        buyer_note: buyerNote.trim() || null,
        payment_method_id: paymentMethodId,
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      });
      clearCart();
      setSuccessOrder(order);
      toast.success("Order placed successfully");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Checkout failed";
      setError(msg);
      toast.error(msg);
      try {
        const store = await storesApi.getStoreBySlug(slug);
        reconcileWithProducts(store.products);
      } catch {
        // ignore
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !successOrder) return <LoadingState message="Loading checkout…" />;

  if (successOrder) {
    return (
      <div className="mx-auto max-w-2xl">
        <OrderSuccessPanel order={successOrder} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
        <p className="mt-1 text-neutral-600">Complete your order — no account required.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>{formatMoney(parseFloat(item.price) * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Input
              label="Full name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
            />
            <Input
              label="Phone"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              required
            />
            <Textarea
              label="Delivery address"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              rows={3}
              required
            />
            <Textarea
              label="Note (optional)"
              value={buyerNote}
              onChange={(e) => setBuyerNote(e.target.value)}
              rows={2}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PaymentMethodSelector
              methods={paymentMethods}
              selectedId={paymentMethodId}
              onSelect={setPaymentMethodId}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="md" loading={submitting}>
          Place order
        </Button>
      </form>
    </div>
  );
}
