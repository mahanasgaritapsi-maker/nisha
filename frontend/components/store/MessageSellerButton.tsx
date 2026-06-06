"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as conversationsApi from "@/lib/api/customer/conversations";
import { getCustomerToken } from "@/lib/auth/customer-token";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

type MessageSellerButtonProps = {
  storeId: number;
};

export function MessageSellerButton({ storeId }: MessageSellerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getCustomerToken());
  }, []);

  const loginHref = `${paths.customer.login}?redirect=${encodeURIComponent(
    `${paths.customer.conversations}?start_store=${storeId}`,
  )}`;

  async function handleClick() {
    if (!getCustomerToken()) return;
    setLoading(true);
    try {
      const conv = await conversationsApi.createConversation({ store_id: storeId });
      router.push(paths.customer.conversationDetail(conv.id));
    } catch {
      router.push(`${paths.customer.conversations}?start_store=${storeId}`);
    } finally {
      setLoading(false);
    }
  }

  if (!hasToken) {
    return (
      <Link href={loginHref}>
        <Button variant="secondary" size="sm">
          Sign in to chat
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="secondary" size="sm" disabled={loading} onClick={() => void handleClick()}>
      Message seller
    </Button>
  );
}
