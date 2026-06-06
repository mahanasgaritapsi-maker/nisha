"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as storesApi from "@/lib/api/admin/stores";
import { paths } from "@/lib/auth/paths";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

export default function AdminStoresPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchStores = useCallback(
    () => storesApi.listStores({ page, page_size: 20 }),
    [page],
  );

  const { data, error, isLoading, refetch } = useSellerFetch(fetchStores, [page]);

  async function toggleActive(storeId: number, activate: boolean) {
    setActionId(storeId);
    try {
      if (activate) {
        await storesApi.activateStore(storeId);
        toast.success("Store activated");
      } else {
        await storesApi.deactivateStore(storeId);
        toast.success("Store deactivated");
      }
      await refetch();
    } catch {
      toast.error("Failed to update store");
    } finally {
      setActionId(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Stores</h1>
        <p className="mt-1 text-neutral-600">Manage seller stores on the platform</p>
      </div>

      {isLoading && <TableSkeleton rows={6} columns={6} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState title="No stores" description="Stores will appear when sellers register." />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Products</TableHeaderCell>
                <TableHeaderCell>Orders</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <Link
                        href={paths.store(store.slug)}
                        className="text-xs text-indigo-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        /store/{store.slug}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{store.owner_email}</TableCell>
                  <TableCell>{store.product_count}</TableCell>
                  <TableCell>{store.order_count}</TableCell>
                  <TableCell>
                    <Badge variant={store.is_active ? "success" : "neutral"}>
                      {store.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionId === store.id}
                      onClick={() => toggleActive(store.id, !store.is_active)}
                    >
                      {store.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
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
