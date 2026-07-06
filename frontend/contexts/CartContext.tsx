"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadCartFromStorage, saveCartToStorage } from "@/lib/cart/storage";
import type { PublicProduct, PublicProductVariant } from "@/types/public/store";

export type CartLine = {
  productId: number;
  variantId?: number | null;
  variantName?: string | null;
  title: string;
  price: string;
  imageUrl: string | null;
  stockQuantity: number;
  quantity: number;
};

function sameLine(line: CartLine, productId: number, variantId?: number | null): boolean {
  return line.productId === productId && (line.variantId ?? null) === (variantId ?? null);
}

type CartContextValue = {
  slug: string;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (
    product: PublicProduct,
    quantity?: number,
    variant?: PublicProductVariant | null,
  ) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void;
  removeItem: (productId: number, variantId?: number | null) => void;
  clearCart: () => void;
  reconcileWithProducts: (products: PublicProduct[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage(slug));
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    saveCartToStorage(slug, items);
  }, [slug, items, hydrated]);

  const addItem = useCallback(
    (product: PublicProduct, quantity = 1, variant: PublicProductVariant | null = null) => {
      const stock = variant ? variant.stock_quantity : product.stock_quantity;
      if (stock <= 0) return;
      const price = String(variant?.price_override ?? product.price);
      const imageUrl = product.images[0]?.image_url ?? null;
      setItems((prev) => {
        const existing = prev.find((i) => sameLine(i, product.id, variant?.id ?? null));
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, stock);
          return prev.map((i) =>
            sameLine(i, product.id, variant?.id ?? null)
              ? { ...i, quantity: nextQty, stockQuantity: stock, price }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            variantId: variant?.id ?? null,
            variantName: variant?.name ?? null,
            title: product.title,
            price,
            imageUrl,
            stockQuantity: stock,
            quantity: Math.min(quantity, stock),
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number, variantId: number | null = null) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (!sameLine(i, productId, variantId)) return i;
            if (quantity <= 0) return null;
            return { ...i, quantity: Math.min(quantity, i.stockQuantity) };
          })
          .filter((i): i is CartLine => i !== null),
      );
    },
    [],
  );

  const removeItem = useCallback((productId: number, variantId: number | null = null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, variantId)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const reconcileWithProducts = useCallback((products: PublicProduct[]) => {
    const byId = new Map(products.map((p) => [p.id, p]));
    setItems((prev) => {
      const next: CartLine[] = [];
      for (const line of prev) {
        const product = byId.get(line.productId);
        if (!product) continue;
        const variantId = line.variantId ?? null;
        if (variantId !== null) {
          const variant = (product.variants ?? []).find((v) => v.id === variantId);
          if (!variant || variant.stock_quantity <= 0) continue;
          next.push({
            ...line,
            variantId,
            variantName: variant.name,
            title: product.title,
            price: String(variant.price_override ?? product.price),
            stockQuantity: variant.stock_quantity,
            imageUrl: product.images[0]?.image_url ?? line.imageUrl,
            quantity: Math.min(line.quantity, variant.stock_quantity),
          });
          continue;
        }
        // Products that now require a variant can no longer be ordered
        // without one, so drop stale variant-less lines.
        if ((product.variants ?? []).length > 0) continue;
        if (product.stock_quantity <= 0) continue;
        next.push({
          ...line,
          variantId: null,
          variantName: null,
          title: product.title,
          price: String(product.price),
          stockQuantity: product.stock_quantity,
          imageUrl: product.images[0]?.image_url ?? line.imageUrl,
          quantity: Math.min(line.quantity, product.stock_quantity),
        });
      }
      return next;
    });
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  function safeParsePrice(price: string): number {
    const num = Number(price);
    return Number.isNaN(num) ? 0 : num;
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + safeParsePrice(i.price) * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      slug,
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      reconcileWithProducts,
    }),
    [
      slug,
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      reconcileWithProducts,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
