"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { PublicProduct } from "@/types/public/store";

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const imageUrl = product.images[0]?.image_url;

  function handleAdd() {
    if (product.stock_quantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    addItem(product, qty);
    toast.success(`Added ${product.title} to cart`);
    setQty(1);
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="aspect-square bg-neutral-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(imageUrl)}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{product.title}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{product.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-neutral-900">
            {formatMoney(product.price)}
          </span>
          <span className="text-sm text-neutral-500">{product.stock_quantity} in stock</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`qty-${product.id}`}>
            Quantity
          </label>
          <input
            id={`qty-${product.id}`}
            type="number"
            min={1}
            max={product.stock_quantity}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(product.stock_quantity, Number(e.target.value))))}
            className="w-16 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <Button className="flex-1" size="sm" onClick={handleAdd} disabled={product.stock_quantity <= 0}>
            Add to cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
