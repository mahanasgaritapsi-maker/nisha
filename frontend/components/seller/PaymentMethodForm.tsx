"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodType,
  PaymentMethodUpdate,
} from "@/types/seller/payment-method";

type PaymentMethodFormProps = {
  initial?: PaymentMethod;
  onSubmit: (data: PaymentMethodCreate | PaymentMethodUpdate) => Promise<void>;
  onCancel: () => void;
};

export function PaymentMethodForm({ initial, onSubmit, onCancel }: PaymentMethodFormProps) {
  const [type, setType] = useState<PaymentMethodType>(initial?.type ?? "CARD_TO_CARD");
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [cardNumber, setCardNumber] = useState(initial?.card_number ?? "");
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? "");
  const [walletAddress, setWalletAddress] = useState(initial?.wallet_address ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setType(initial.type);
      setDisplayName(initial.display_name);
      setCardNumber(initial.card_number ?? "");
      setOwnerName(initial.owner_name ?? "");
      setWalletAddress(initial.wallet_address ?? "");
      setExternalUrl(initial.external_url ?? "");
      setInstructions(initial.instructions ?? "");
      setIsActive(initial.is_active);
    }
  }, [initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setLoading(true);
    try {
      const base = {
        display_name: displayName.trim(),
        instructions: instructions.trim() || null,
        is_active: isActive,
      };
      if (initial) {
        const update: PaymentMethodUpdate = { ...base, type };
        if (type === "CARD_TO_CARD") {
          update.card_number = cardNumber.trim();
          update.owner_name = ownerName.trim();
        } else if (type === "CRYPTO") {
          update.wallet_address = walletAddress.trim();
        } else {
          update.external_url = externalUrl.trim();
        }
        await onSubmit(update);
      } else {
        const create: PaymentMethodCreate = { ...base, type };
        if (type === "CARD_TO_CARD") {
          create.card_number = cardNumber.trim();
          create.owner_name = ownerName.trim();
        } else if (type === "CRYPTO") {
          create.wallet_address = walletAddress.trim();
        } else {
          create.external_url = externalUrl.trim();
        }
        await onSubmit(create);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PaymentMethodType)}
          disabled={!!initial}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="CARD_TO_CARD">Card to card</option>
          <option value="CRYPTO">Crypto</option>
          <option value="EXTERNAL_GATEWAY">External gateway</option>
        </select>
      </div>
      <Input
        label="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      {type === "CARD_TO_CARD" && (
        <>
          <Input
            label="Card number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />
          <Input
            label="Owner name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />
        </>
      )}
      {type === "CRYPTO" && (
        <Input
          label="Wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          required
        />
      )}
      {type === "EXTERNAL_GATEWAY" && (
        <Input
          label="External URL"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          required
        />
      )}
      <Textarea
        label="Instructions"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={3}
      />
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-neutral-300"
        />
        Active
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
