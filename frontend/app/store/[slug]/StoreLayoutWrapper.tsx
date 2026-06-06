"use client";

import { useEffect, useState } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CartProvider } from "@/contexts/CartContext";

export function StoreLayoutWrapper({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [storeName, setStoreName] = useState(slug);

  useEffect(() => {
    storesApi
      .getStoreBySlug(slug)
      .then((data) => setStoreName(data.store.name))
      .catch(() => setStoreName(slug));
  }, [slug]);

  return (
    <CartProvider slug={slug}>
      <div className="flex min-h-screen flex-col bg-neutral-50">
        <StoreHeader storeName={storeName} slug={slug} onCartClick={() => setCartOpen(true)} />
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:py-8">
          <div className="min-w-0 flex-1">{children}</div>
          <CartDrawer open={cartOpen} slug={slug} onClose={() => setCartOpen(false)} />
        </div>
      </div>
    </CartProvider>
  );
}
