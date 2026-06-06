"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Product, ProductCreate, ProductUpdate } from "@/types/seller/product";

type ProductFormProps = {
  initial?: Product;
  onSubmit: (data: ProductCreate | ProductUpdate) => Promise<void>;
  submitLabel?: string;
};

function imageUrlsToText(images: Product["images"]): string {
  return images.map((i) => i.image_url).join("\n");
}

export function ProductForm({
  initial,
  onSubmit,
  submitLabel = "Save product",
}: ProductFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [imageUrlsText, setImageUrlsText] = useState(
    initial ? imageUrlsToText(initial.images) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parseImageUrls(): string[] | null {
    const urls = imageUrlsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return urls.length > 0 ? urls : null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be greater than 0.");
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Stock must be 0 or more.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        stock_quantity: stockNum,
        is_active: isActive,
        image_urls: parseImageUrls(),
      };
      await onSubmit(payload);
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
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Stock quantity"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <Textarea
            label="Image URLs"
            hint="One URL per line"
            value={imageUrlsText}
            onChange={(e) => setImageUrlsText(e.target.value)}
            rows={4}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Product is active
          </label>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
