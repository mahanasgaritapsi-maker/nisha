"use client";

import { cn } from "@/lib/cn";

type ToastItem = {
  id: number;
  message: string;
  variant: "success" | "error";
};

type ToastContainerProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg",
            toast.variant === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              className="shrink-0 text-neutral-500 hover:text-neutral-800"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
