"use client";

import Link from "next/link";
import * as dashboardApi from "@/lib/api/seller/dashboard";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/seller/PageHeader";
import { StatCard } from "@/components/seller/StatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SellerDashboardPage() {
  const { data, error, isLoading } = useSellerFetch(() => dashboardApi.getDashboard(), []);
  const { data: store } = useSellerFetch(() => storeApi.getStore(), []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your store performance" />
        <StatCardSkeleton count={6} />
        <TableSkeleton rows={3} columns={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your store performance" />
        <ErrorAlert message={error ?? "Failed to load dashboard"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your store performance"
        action={
          store?.slug ? (
            <Link href={paths.store(store.slug)} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">View your store</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total orders" value={data.total_orders} />
        <StatCard label="Pending orders" value={data.pending_orders} />
        <StatCard label="Confirmed revenue" value={formatMoney(data.confirmed_revenue)} />
        <StatCard label="Pending revenue" value={formatMoney(data.pending_revenue)} />
        <StatCard label="Today's revenue" value={formatMoney(data.today_revenue)} />
        <StatCard label="Payment uploaded" value={data.payment_uploaded_orders} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.low_stock_products.length === 0 ? (
              <EmptyState title="No low stock items" description="All products are well stocked." />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Product</TableHeaderCell>
                    <TableHeaderCell>Stock</TableHeaderCell>
                    <TableHeaderCell>Price</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.low_stock_products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>{p.stock_quantity}</TableCell>
                      <TableCell>{formatMoney(p.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recent_orders.length === 0 ? (
              <EmptyState title="No orders yet" description="Orders will appear here." />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Invoice</TableHeaderCell>
                    <TableHeaderCell>Buyer</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={paths.seller.orderDetail(o.id)}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          {o.invoice_code}
                        </Link>
                      </TableCell>
                      <TableCell>{o.buyer_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>{formatMoney(o.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
