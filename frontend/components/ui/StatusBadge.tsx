import type { OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  PENDING_PAYMENT: { label: "Pending payment", variant: "warning" },
  PAYMENT_UPLOADED: { label: "Payment uploaded", variant: "info" },
  PAYMENT_CONFIRMED: { label: "Payment confirmed", variant: "success" },
  PAYMENT_REJECTED: { label: "Payment rejected", variant: "danger" },
  PREPARING: { label: "Preparing", variant: "info" },
  SHIPPED: { label: "Shipped", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
