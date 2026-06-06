"use client";

import Link from "next/link";
import * as dashboardApi from "@/lib/api/admin/dashboard";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { StatCard } from "@/components/seller/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const { data, error, isLoading } = useSellerFetch(() => dashboardApi.getDashboard(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin dashboard</h1>
        <p className="mt-1 text-neutral-600">Platform-wide metrics and recent activity</p>
      </div>

      {isLoading && (
        <>
          <StatCardSkeleton count={6} />
          <TableSkeleton rows={4} columns={5} />
        </>
      )}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total stores" value={data.total_stores} />
            <StatCard label="Active stores" value={data.active_stores} />
            <StatCard label="Inactive stores" value={data.inactive_stores} />
            <StatCard label="Total sellers" value={data.total_sellers} />
            <StatCard label="Total products" value={data.total_products} />
            <StatCard label="Total orders" value={data.total_orders} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Confirmed revenue" value={formatMoney(data.confirmed_revenue)} />
            <StatCard label="Pending revenue" value={formatMoney(data.pending_revenue)} />
          </div>

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
                      <TableHeaderCell>Store</TableHeaderCell>
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
                            href={paths.admin.orderDetail(o.id)}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {o.invoice_code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={paths.store(o.store_slug)}
                            className="text-sm text-neutral-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {o.store_name}
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
        </>
      )}
    </div>
  );
}
