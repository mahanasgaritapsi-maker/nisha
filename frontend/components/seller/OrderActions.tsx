"use client";

import { Button } from "@/components/ui/Button";
import {
  getAvailableOrderActions,
  isDestructiveAction,
  ORDER_ACTION_LABELS,
  type OrderAction,
} from "@/lib/seller/orderActions";
import type { OrderStatus } from "@/types/order";

type OrderActionsProps = {
  status: OrderStatus;
  loading?: boolean;
  onAction: (action: OrderAction) => void;
};

export function OrderActions({ status, loading, onAction }: OrderActionsProps) {
  const actions = getAvailableOrderActions(status);

  if (actions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No actions available for this order status.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action}
          size="sm"
          variant={
            isDestructiveAction(action)
              ? "danger"
              : action === "confirm_payment"
                ? "primary"
                : "secondary"
          }
          disabled={loading}
          onClick={() => onAction(action)}
        >
          {ORDER_ACTION_LABELS[action]}
        </Button>
      ))}
    </div>
  );
}
