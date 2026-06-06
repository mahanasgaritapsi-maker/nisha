"use client";

import Link from "next/link";
import { useState } from "react";
import type { CheckoutResponse } from "@/types/public/checkout";
import { publicPaths } from "@/lib/paths/public";
import { formatMoney } from "@/lib/format";
import { PaymentInstructions } from "@/components/store/PaymentInstructions";
import { PaymentProofUpload } from "@/components/store/PaymentProofUpload";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

type OrderSuccessPanelProps = {
  order: CheckoutResponse;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs font-medium uppercase text-neutral-500">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <code className="break-all text-sm font-semibold text-neutral-900">{value}</code>
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function OrderSuccessPanel({ order }: OrderSuccessPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h2 className="text-xl font-bold text-green-900">Order placed successfully</h2>
        <p className="mt-2 text-sm text-green-800">
          Save your invoice code and password below. You will need them to track your order and
          upload payment proof.
        </p>
      </div>

      <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
        <p className="font-semibold text-red-900">Important — save these now</p>
        <p className="mt-1 text-sm text-red-800">
          The invoice password is shown only once. We cannot recover it for you.
        </p>
        <div className="mt-4 space-y-3">
          <CopyField label="Invoice code" value={order.invoice_code} />
          <CopyField label="Invoice password" value={order.invoice_edit_password} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="text-sm text-neutral-600">
          Total: {formatMoney(order.total_amount)}
        </span>
      </div>

      <PaymentInstructions method={order.payment_method} />

      <PaymentProofUpload
        invoiceCode={order.invoice_code}
        defaultPassword={order.invoice_edit_password}
      />

      <div className="flex flex-wrap gap-3">
        <Link href={publicPaths.trackOrder}>
          <Button variant="secondary">Track this order</Button>
        </Link>
        <Link href={publicPaths.invoice(order.invoice_code)}>
          <Button variant="ghost">Printable invoice</Button>
        </Link>
      </div>
    </div>
  );
}
