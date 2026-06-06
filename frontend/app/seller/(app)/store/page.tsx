"use client";

import Link from "next/link";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/seller/PageHeader";
import { StoreSettingsForm } from "@/components/seller/StoreSettingsForm";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { StoreUpdate } from "@/types/seller/store";

export default function SellerStorePage() {
  const toast = useToast();
  const { data, error, isLoading, refetch } = useSellerFetch(() => storeApi.getStore(), []);

  async function handleSubmit(body: StoreUpdate) {
    await storeApi.updateStore(body);
    toast.success("Store settings saved");
    await refetch();
  }

  if (isLoading) return <LoadingState message="Loading store…" />;
  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Store settings" description="Manage your public store profile" />
        <ErrorAlert message={error ?? "Failed to load store"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store settings"
        description="Manage your public store profile"
        action={
          <Link href={paths.store(data.slug)} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">View your store</Button>
          </Link>
        }
      />
      <StoreSettingsForm store={data} onSubmit={handleSubmit} />
    </div>
  );
}
