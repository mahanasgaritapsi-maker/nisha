import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { publicPaths } from "@/lib/paths/public";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Sell online without the complexity
        </h1>
        <p className="max-w-2xl text-lg text-neutral-600">
          Nisha is a lightweight platform for Instagram and Telegram sellers.
          Create a store, add products, accept manual payments, and manage
          orders — all in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={paths.seller.register}>
            <Button size="md">Start selling — Register</Button>
          </Link>
          <Link href={paths.seller.login}>
            <Button variant="secondary" size="md">
              Seller login
            </Button>
          </Link>
          <Link href={paths.trackOrder}>
            <Button variant="ghost" size="md">
              Track order
            </Button>
          </Link>
          <Link href={publicPaths.store("demo-store")}>
            <Button variant="ghost" size="md">
              Browse demo store
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Store owners",
            desc: "Manage products, stock, payment methods, and orders from one dashboard.",
          },
          {
            title: "Customers",
            desc: "Browse stores, checkout as a guest, and track orders with your invoice code.",
          },
          {
            title: "Platform admin",
            desc: "Monitor stores, revenue, and orders across the entire platform.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="py-5">
              <h3 className="font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Platform access</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Sellers can register and manage their shop. Admins use a separate login
          for platform oversight.
        </p>
        <div className="mt-4">
          <Link href={paths.admin.login}>
            <Button variant="ghost" size="sm">
              Admin login
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
