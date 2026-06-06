"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Store, StoreUpdate } from "@/types/seller/store";

type StoreSettingsFormProps = {
  store: Store;
  onSubmit: (data: StoreUpdate) => Promise<void>;
};

export function StoreSettingsForm({ store, onSubmit }: StoreSettingsFormProps) {
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [description, setDescription] = useState(store.description ?? "");
  const [logoUrl, setLogoUrl] = useState(store.logo_url ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [supportContact, setSupportContact] = useState(store.support_contact ?? "");
  const [isActive, setIsActive] = useState(store.is_active);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(store.name);
    setSlug(store.slug);
    setDescription(store.description ?? "");
    setLogoUrl(store.logo_url ?? "");
    setPhone(store.phone ?? "");
    setSupportContact(store.support_contact ?? "");
    setIsActive(store.is_active);
  }, [store]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("Slug must be lowercase letters, numbers, and hyphens only.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        phone: phone.trim() || null,
        support_contact: supportContact.trim() || null,
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Input label="Store name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            hint="Used in your public store URL"
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <Input
            label="Logo URL"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input
            label="Support contact"
            value={supportContact}
            onChange={(e) => setSupportContact(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Store is active (visible on public pages when platform allows)
          </label>
          <Button type="submit" loading={loading}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
