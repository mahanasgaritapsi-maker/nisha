"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ChatComposerProps = {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
};

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(body);
      setText("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t border-neutral-200 bg-white p-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={2}
        disabled={disabled || sending}
        className="flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <Button type="submit" disabled={disabled || sending || !text.trim()}>
        Send
      </Button>
    </form>
  );
}
