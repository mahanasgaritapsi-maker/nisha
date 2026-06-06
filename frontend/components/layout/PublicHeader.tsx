import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

export function PublicHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href={paths.home} className="text-lg font-semibold tracking-tight text-neutral-900">
          Nisha
        </Link>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href={paths.trackOrder}>
            <Button variant="ghost" size="sm">
              Track order
            </Button>
          </Link>
          <Link href={paths.customer.conversations}>
            <Button variant="ghost" size="sm">
              Messages
            </Button>
          </Link>
          <Link href={paths.customer.login}>
            <Button variant="ghost" size="sm">
              Customer login
            </Button>
          </Link>
          <Link href={paths.seller.login}>
            <Button variant="ghost" size="sm">
              Seller login
            </Button>
          </Link>
          <Link href={paths.seller.register}>
            <Button variant="secondary" size="sm">
              Register
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
