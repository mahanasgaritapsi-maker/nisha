import { cn } from "@/lib/cn";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-neutral-600",
        className,
      )}
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
        aria-hidden
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}
