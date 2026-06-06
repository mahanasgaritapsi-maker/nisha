"use client";

import { use } from "react";
import Link from "next/link";
import * as ordersApi from "@/lib/api/admin/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const orderId = parseInt(id, 10);

  const { data, error, isLoading } = useSellerFetch(
    () => ordersApi.getOrder(orderId),
    [orderId],
  );

  if (isLoading) return <LoadingState message="Loading order…" />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error ?? "Order not found"} />
        <Link href={paths.admin.orders} className="text-sm text-indigo-600 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={paths.admin.orders} className="text-sm text-indigo-600 hover:underline">
          ← Back to orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-900">{data.invoice_code}</h1>
          <StatusBadge status={data.status} />
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {data.store_name} ·{" "}
          <Link
            href={paths.store(data.store_slug)}
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View store
          </Link>
          {" · "}
          Placed {formatDateTime(data.created_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buyer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <p>
              <span className="text-neutral-500">Name:</span> {data.buyer_name}
            </p>
            <p>
              <span className="text-neutral-500">Phone:</span> {data.buyer_phone}
            </p>
            <p>
              <span className="text-neutral-500">Address:</span> {data.buyer_address}
            </p>
            {data.buyer_note && (
              <p>
                <span className="text-neutral-500">Note:</span> {data.buyer_note}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <p className="font-medium">{data.payment_method.display_name}</p>
            <Badge variant="info">{data.payment_method.type}</Badge>
            {data.payment_method.instructions && (
              <p className="text-neutral-600">{data.payment_method.instructions}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Qty</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_title_snapshot}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatMoney(item.unit_price_snapshot)}</TableCell>
                  <TableCell>{formatMoney(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-right font-semibold">
            Total: {formatMoney(data.total_amount)}
          </p>
        </CardContent>
      </Card>

      {data.payment_proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment proofs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pt-0">
            {data.payment_proofs.map((proof) => (
              <a
                key={proof.id}
                href={resolveMediaUrl(proof.image_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-neutral-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(proof.image_url)}
                  alt="Payment proof"
                  className="h-32 w-auto object-cover"
                />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {data.status_history.map((entry) => (
            <div key={entry.id} className="border-b border-neutral-100 pb-2 last:border-0">
              <p className="font-medium">
                {entry.old_status ?? "—"} → {entry.new_status}
              </p>
              {entry.note && <p className="text-neutral-600">{entry.note}</p>}
              <p className="text-xs text-neutral-500">{formatDateTime(entry.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
