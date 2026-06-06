import { EmptyState } from "@/components/ui/EmptyState";

export function ComingSoon({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      description="This section will be available in the next release. Check back soon."
    />
  );
}
