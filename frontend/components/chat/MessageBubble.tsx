import { formatDateTime } from "@/lib/format";
import type { Message } from "@/types/chat";

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[70%] ${
          isOwn
            ? "rounded-br-md bg-indigo-600 text-white"
            : "rounded-bl-md bg-neutral-100 text-neutral-900"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 block text-xs underline ${isOwn ? "text-indigo-100" : "text-indigo-600"}`}
          >
            Attachment
          </a>
        )}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? "text-indigo-200" : "text-neutral-500"
          }`}
        >
          <span>{formatDateTime(message.created_at)}</span>
          {isOwn && <span aria-label={message.is_read ? "Read" : "Sent"}>{message.is_read ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}
