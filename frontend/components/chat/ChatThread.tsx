"use client";

import { useEffect, useRef } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { ConversationDetail } from "@/types/chat";
import type { SenderType } from "@/types/chat";

type ChatThreadProps = {
  conversation: ConversationDetail | null;
  isLoading: boolean;
  error: string | null;
  ownSenderType: SenderType;
  onSend: (body: string) => Promise<void>;
  header: React.ReactNode;
};

export function ChatThread({
  conversation,
  isLoading,
  error,
  ownSenderType,
  onSend,
  header,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  if (isLoading && !conversation) {
    return <LoadingState message="Loading conversation…" />;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-neutral-200 bg-white lg:h-[calc(100vh-6rem)]">
      <div className="border-b border-neutral-200 px-4 py-3">{header}</div>
      <ErrorAlert message={error ?? ""} className="mx-4 mt-2" />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_type === ownSenderType}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatComposer onSend={onSend} disabled={!conversation} />
    </div>
  );
}
