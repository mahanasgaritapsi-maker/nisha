"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as productsApi from "@/lib/api/seller/products";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { PageHeader } from "@/components/seller/PageHeader";
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

export default function SellerProductsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(
    () => productsApi.listProducts({ page, page_size: 20 }),
    [page],
  );

  const { data, error, isLoading, refetch } = useSellerFetch(fetchProducts, [page]);

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await productsApi.deleteProduct(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your catalog"
        action={
          <Link href={paths.seller.productNew}>
            <Button>Add product</Button>
          </Link>
        }
      />

      <ErrorAlert message={error ?? ""} />

      {isLoading && <TableSkeleton rows={6} columns={5} />}

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState
          title="No products yet"
          description="Add your first product to start selling."
          action={
            <Link href={paths.seller.productNew}>
              <Button>Add product</Button>
            </Link>
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell>Stock</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{formatMoney(product.price)}</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={paths.seller.productEdit(product.id)}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteId(product.id)}
                      >
                        Delete
                      </Button>
                    </div>
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

      <ConfirmModal
        open={deleteId !== null}
        title="Delete product"
        message="This cannot be undone. The product will be removed from your store."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
