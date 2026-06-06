import { cn } from "@/lib/cn";
import type { PublicPaymentMethod } from "@/types/public/store";

type PaymentMethodSelectorProps = {
  methods: PublicPaymentMethod[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function PaymentMethodSelector({
  methods,
  selectedId,
  onSelect,
}: PaymentMethodSelectorProps) {
  if (methods.length === 0) {
    return <p className="text-sm text-red-600">No payment methods available for this store.</p>;
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <label
          key={method.id}
          className={cn(
            "block cursor-pointer rounded-lg border p-4 transition-colors",
            selectedId === method.id
              ? "border-indigo-500 bg-indigo-50"
              : "border-neutral-200 hover:border-neutral-300",
          )}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="payment_method"
              checked={selectedId === method.id}
              onChange={() => onSelect(method.id)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-neutral-900">{method.display_name}</p>
              <p className="text-neutral-500">{method.type.replace(/_/g, " ")}</p>
              {method.type === "CARD_TO_CARD" && (
                <div className="mt-2 space-y-1 text-neutral-700">
                  {method.card_number && <p>Card: {method.card_number}</p>}
                  {method.owner_name && <p>Name: {method.owner_name}</p>}
                </div>
              )}
              {method.type === "CRYPTO" && method.wallet_address && (
                <p className="mt-2 break-all text-neutral-700">{method.wallet_address}</p>
              )}
              {method.type === "EXTERNAL_GATEWAY" && method.external_url && (
                <a
                  href={method.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-indigo-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open payment link
                </a>
              )}
              {method.instructions && (
                <p className="mt-2 text-neutral-600">{method.instructions}</p>
              )}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
