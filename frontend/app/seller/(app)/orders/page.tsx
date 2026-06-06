"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import * as ordersApi from "@/lib/api/seller/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/seller/PageHeader";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PaginationControls } from "@/components/ui/PaginationControls";
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
import type { OrderStatus } from "@/types/order";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Pending payment" },
  { value: "PAYMENT_UPLOADED", label: "Payment uploaded" },
  { value: "PAYMENT_CONFIRMED", label: "Payment confirmed" },
  { value: "PAYMENT_REJECTED", label: "Payment rejected" },
  { value: "PREPARING", label: "Preparing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function SellerOrdersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const fetchOrders = useCallback(
    () =>
      ordersApi.listOrders({
        status: status ? (status as OrderStatus) : undefined,
        search: debouncedSearch || undefined,
        page,
        page_size: 20,
      }),
    [status, debouncedSearch, page],
  );

  const { data, error, isLoading } = useSellerFetch(fetchOrders, [status, debouncedSearch, page]);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage customer orders" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Input
            label="Search"
            placeholder="Invoice, buyer name, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <TableSkeleton rows={6} columns={5} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState title="No orders found" description="Try adjusting your filters." />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Invoice</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={paths.seller.orderDetail(order.id)}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {order.invoice_code}
                    </Link>
                  </TableCell>
                  <TableCell>{order.buyer_phone}</TableCell>
                  <TableCell>{formatMoney(order.total_amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{formatDateTime(order.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && (
            <PaginationControls
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
