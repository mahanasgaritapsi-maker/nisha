"use client";

import { useEffect, useState } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { PublicShell } from "@/components/layout/PublicShell";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CartProvider } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";

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
      <PublicShell
        title={storeName}

        showDefaultActions={false}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setCartOpen(true)}>
            سبد خرید
          </Button>
        }
      >
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">{children}</div>
          <CartDrawer open={cartOpen} slug={slug} onClose={() => setCartOpen(false)} />
        </div>
      </PublicShell>
    </CartProvider>
  );
}
