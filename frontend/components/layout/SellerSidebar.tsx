"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: paths.seller.dashboard, label: "Dashboard" },
  { href: paths.seller.store, label: "Store settings" },
  { href: paths.seller.products, label: "Products" },
  { href: paths.seller.paymentMethods, label: "Payment methods" },
  { href: paths.seller.orders, label: "Orders" },
  { href: paths.seller.conversations, label: "Messages" },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push(paths.seller.login);
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-semibold text-neutral-900">Seller panel</span>
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </Button>
      </div>
      <aside
        className={cn(
          "flex w-full flex-col border-r border-neutral-200 bg-white lg:w-64 lg:shrink-0",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="hidden border-b border-neutral-200 px-4 py-5 lg:block">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Seller
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
            {user?.full_name}
          </p>
          <p className="truncate text-xs text-neutral-500">{user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
