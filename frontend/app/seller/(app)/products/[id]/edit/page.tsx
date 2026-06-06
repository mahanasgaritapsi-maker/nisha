"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import * as productsApi from "@/lib/api/seller/products";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/seller/PageHeader";
import { ProductForm } from "@/components/seller/ProductForm";
import { LoadingState } from "@/components/ui/LoadingState";
import type { ProductUpdate } from "@/types/seller/product";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const productId = parseInt(id, 10);
  const router = useRouter();
  const toast = useToast();

  const { data, error, isLoading } = useSellerFetch(
    () => productsApi.getProduct(productId),
    [productId],
  );

  async function handleSubmit(body: ProductUpdate) {
    await productsApi.updateProduct(productId, body);
    toast.success("Product updated");
    router.push(paths.seller.products);
  }

  if (isLoading) return <LoadingState message="Loading product…" />;
  if (error || !data) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error ?? "Product not found"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit product" description={data.title} />
      <ProductForm initial={data} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}
