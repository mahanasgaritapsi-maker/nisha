"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import * as conversationsApi from "@/lib/api/seller/conversations";
import { paths } from "@/lib/auth/paths";
import { ChatThread } from "@/components/chat/ChatThread";
import { useChatPolling } from "@/hooks/useChatPolling";
import { useToast } from "@/contexts/ToastContext";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function SellerConversationPage({ params }: PageProps) {
  const { id } = use(params);
  const conversationId = parseInt(id, 10);
  const toast = useToast();

  const fetchConversation = useCallback(
    () => conversationsApi.getConversation(conversationId),
    [conversationId],
  );

  const { data, error, isLoading, refetch } = useChatPolling({
    fetchFn: fetchConversation,
    intervalMs: 4000,
  });

  return (
    <div className="space-y-6">
      <Link href={paths.seller.conversations} className="text-sm text-indigo-600 hover:underline">
        ← Back to messages
      </Link>
      <ChatThread
        conversation={data}
        isLoading={isLoading}
        error={error}
        ownSenderType="SELLER"
        onSend={async (body) => {
          try {
            await conversationsApi.sendMessage(conversationId, { body });
            await refetch();
          } catch {
            toast.error("Failed to send message");
          }
        }}
        header={
          data ? (
            <div>
              <h1 className="font-semibold text-neutral-900">{data.customer_name}</h1>
              {data.invoice_code && (
                <p className="text-xs text-neutral-500">Order {data.invoice_code}</p>
              )}
            </div>
          ) : (
            <span className="text-neutral-500">Loading…</span>
          )
        }
      />
    </div>
  );
}
