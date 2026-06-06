"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { publicPaths } from "@/lib/paths/public";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type CartDrawerProps = {
  open: boolean;
  slug: string;
  onClose: () => void;
};

export function CartDrawer({ open, slug, onClose }: CartDrawerProps) {
  const { items, subtotal, updateQuantity, removeItem, itemCount } = useCart();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          aria-label="Close cart"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed bottom-0 right-0 z-50 flex max-h-[85vh] w-full flex-col border-l border-neutral-200 bg-white shadow-xl transition-transform duration-200 sm:max-w-md lg:static lg:z-auto lg:max-h-none lg:w-80 lg:shrink-0 lg:translate-x-0 lg:rounded-xl lg:border lg:shadow-sm",
          open ? "translate-y-0" : "translate-y-full lg:translate-y-0",
          !open && "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100",
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold text-neutral-900">Cart ({itemCount})</h2>
          <button type="button" className="text-neutral-500 lg:hidden" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-center text-sm text-neutral-500">Your cart is empty</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(item.imageUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-900">{item.title}</p>
                    <p className="text-sm text-neutral-500">{formatMoney(item.price)} each</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={item.stockQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.productId, Number(e.target.value))
                        }
                        className="w-14 rounded border border-neutral-300 px-1 py-0.5 text-sm"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium">
                    {formatMoney(parseFloat(item.price) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          <Link href={publicPaths.storeCheckout(slug)} onClick={onClose}>
            <Button className="w-full" disabled={items.length === 0}>
              Checkout
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
