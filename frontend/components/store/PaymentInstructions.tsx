import type { CheckoutPaymentInstructions } from "@/types/public/checkout";
import type { PublicPaymentMethod } from "@/types/public/store";

type PaymentInstructionsProps = {
  method: CheckoutPaymentInstructions | PublicPaymentMethod;
};

export function PaymentInstructions({ method }: PaymentInstructionsProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold">Payment instructions — {method.display_name}</p>
      {method.type === "CARD_TO_CARD" && (
        <div className="mt-2 space-y-1">
          {method.card_number && <p>Transfer to card: {method.card_number}</p>}
          {method.owner_name && <p>Account name: {method.owner_name}</p>}
        </div>
      )}
      {method.type === "CRYPTO" && method.wallet_address && (
        <p className="mt-2 break-all">Wallet: {method.wallet_address}</p>
      )}
      {method.type === "EXTERNAL_GATEWAY" && method.external_url && (
        <a
          href={method.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-medium text-indigo-700 hover:underline"
        >
          Pay via external link
        </a>
      )}
      {method.instructions && <p className="mt-2">{method.instructions}</p>}
    </div>
  );
}
