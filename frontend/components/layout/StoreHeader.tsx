"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { paths } from "@/lib/auth/paths";
import { publicPaths } from "@/lib/paths/public";
import { Button } from "@/components/ui/Button";

type StoreHeaderProps = {
  storeName: string;
  slug: string;
  onCartClick?: () => void;
};

export function StoreHeader({ storeName, onCartClick }: StoreHeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <Link href={paths.home} className="text-xs text-neutral-500 hover:text-neutral-700">
            Nisha
          </Link>
          <p className="truncate font-semibold text-neutral-900">{storeName}</p>
        </div>
        <nav className="flex items-center gap-2">
          <Link href={publicPaths.trackOrder}>
            <Button variant="ghost" size="sm">
              Track order
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={onCartClick}>
            Cart ({itemCount})
          </Button>
        </nav>
      </div>
    </header>
  );
}
