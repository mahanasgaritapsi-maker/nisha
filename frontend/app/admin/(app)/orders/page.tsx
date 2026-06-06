"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as ordersApi from "@/lib/api/admin/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
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

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(
    () => ordersApi.listOrders({ page, page_size: 20 }),
    [page],
  );

  const { data, error, isLoading } = useSellerFetch(fetchOrders, [page]);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
        <p className="mt-1 text-neutral-600">All platform orders</p>
      </div>

      {isLoading && <TableSkeleton rows={6} columns={6} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState title="No orders" description="Orders will appear when customers checkout." />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Invoice</TableHeaderCell>
                <TableHeaderCell>Store</TableHeaderCell>
                <TableHeaderCell>Buyer</TableHeaderCell>
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
                      href={paths.admin.orderDetail(order.id)}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {order.invoice_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={paths.store(order.store_slug)}
                      className="text-sm hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {order.store_name}
                    </Link>
                  </TableCell>
                  <TableCell>{order.buyer_name}</TableCell>
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
