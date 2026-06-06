"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CustomerAuthGuard } from "@/components/auth/CustomerAuthGuard";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function CustomerAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout } = useCustomerAuth();

  function handleLogout() {
    logout();
    router.push(paths.customer.login);
  }

  return (
    <CustomerAuthGuard>
      <div className="min-h-screen bg-neutral-50">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <div>
              <p className="font-semibold text-neutral-900">Messages</p>
              <p className="text-xs text-neutral-500">{customer?.full_name}</p>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                href={paths.customer.conversations}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm",
                  pathname.startsWith(paths.customer.conversations)
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                Inbox
              </Link>
              <Link href={paths.home} className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100">
                Shop
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl p-4 sm:p-6">{children}</main>
      </div>
    </CustomerAuthGuard>
  );
}
