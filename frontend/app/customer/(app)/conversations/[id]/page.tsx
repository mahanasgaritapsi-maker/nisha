"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import * as conversationsApi from "@/lib/api/customer/conversations";
import { paths } from "@/lib/auth/paths";
import { ChatThread } from "@/components/chat/ChatThread";
import { useChatPolling } from "@/hooks/useChatPolling";
import { useToast } from "@/contexts/ToastContext";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function CustomerConversationPage({ params }: PageProps) {
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

  async function handleSend(body: string) {
    await conversationsApi.sendMessage(conversationId, { body });
    await refetch();
  }

  return (
    <div className="space-y-4">
      <Link href={paths.customer.conversations} className="text-sm text-indigo-600 hover:underline">
        ← Back to inbox
      </Link>
      <ChatThread
        conversation={data}
        isLoading={isLoading}
        error={error}
        ownSenderType="CUSTOMER"
        onSend={async (body) => {
          try {
            await handleSend(body);
          } catch {
            toast.error("Failed to send message");
          }
        }}
        header={
          data ? (
            <div>
              <h1 className="font-semibold text-neutral-900">{data.store_name}</h1>
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
