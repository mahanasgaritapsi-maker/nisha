"use client";

import { useEffect, useState } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { useCart } from "@/contexts/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { MessageSellerButton } from "@/components/store/MessageSellerButton";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PublicStorePageResponse } from "@/types/public/store";

type StorePageClientProps = {
  slug: string;
  initialData?: PublicStorePageResponse | null;
  initialError?: string | null;
};

export function StorePageClient({ slug, initialData, initialError }: StorePageClientProps) {
  const { reconcileWithProducts } = useCart();
  const [data, setData] = useState<PublicStorePageResponse | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(!initialData && !initialError);

  useEffect(() => {
    if (initialData) {
      reconcileWithProducts(initialData.products);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const store = await storesApi.getStoreBySlug(slug);
        if (!cancelled) {
          setData(store);
          reconcileWithProducts(store.products);
        }
      } catch {
        if (!cancelled) setError("Store not found or unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, initialData, reconcileWithProducts]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState
        title="Store not found"
        description={error ?? "This store does not exist or is not active."}
      />
    );
  }

  const { store, products } = data;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {store.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(store.logo_url)}
            alt=""
            className="h-20 w-20 rounded-xl border border-neutral-200 object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{store.name}</h1>
          {store.description && (
            <p className="mt-2 max-w-2xl text-neutral-600">{store.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-500">
            {store.phone && <span>Phone: {store.phone}</span>}
            {store.support_contact && <span>Support: {store.support_contact}</span>}
          </div>
          <div className="mt-4">
            <MessageSellerButton storeId={store.id} />
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <EmptyState title="No products available" description="Check back later." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
