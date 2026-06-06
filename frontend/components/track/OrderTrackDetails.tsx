"use client";

import { useState, type FormEvent } from "react";
import * as ordersApi from "@/lib/api/public/orders";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { PaymentInstructions } from "@/components/store/PaymentInstructions";
import { PaymentProofUpload } from "@/components/store/PaymentProofUpload";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { OrderTrackResponse } from "@/types/public/order";
import type { OrderStatus } from "@/types/order";

const EDITABLE_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_UPLOADED"];
const UPLOAD_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_UPLOADED"];

type OrderTrackDetailsProps = {
  order: OrderTrackResponse;
  password: string;
  onUpdated: (order: OrderTrackResponse) => void;
};

export function OrderTrackDetails({ order, password, onUpdated }: OrderTrackDetailsProps) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [buyerName, setBuyerName] = useState(order.buyer_name);
  const [buyerPhone, setBuyerPhone] = useState(order.buyer_phone);
  const [buyerAddress, setBuyerAddress] = useState(order.buyer_address);
  const [buyerNote, setBuyerNote] = useState(order.buyer_note ?? "");
  const [saving, setSaving] = useState(false);

  const canEdit = EDITABLE_STATUSES.includes(order.status);
  const canUpload = UPLOAD_STATUSES.includes(order.status);

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await ordersApi.editOrder(order.invoice_code, {
        invoice_edit_password: password,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: buyerAddress.trim(),
        buyer_note: buyerNote.trim() || null,
      });
      const refreshed = await ordersApi.trackOrder({
        invoice_code: order.invoice_code,
        invoice_edit_password: password,
      });
      onUpdated(refreshed);
      setEditing(false);
      toast.success("Order details updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function refreshOrder() {
    const refreshed = await ordersApi.trackOrder({
      invoice_code: order.invoice_code,
      invoice_edit_password: password,
    });
    onUpdated(refreshed);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{order.invoice_code}</h2>
        <StatusBadge status={order.status} />
        <span className="text-sm text-neutral-500">{formatDateTime(order.created_at)}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0 text-sm">
          <p className="font-medium">{order.store.name}</p>
          {order.store.phone && <p>Phone: {order.store.phone}</p>}
          {order.store.support_contact && <p>Support: {order.store.support_contact}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Qty</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.product_title}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatMoney(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-right font-semibold">
            Total: {formatMoney(order.total_amount)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Buyer details</CardTitle>
          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {editing ? (
            <form onSubmit={handleEdit} className="space-y-4">
              <Input label="Name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
              <Input label="Phone" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required />
              <Textarea label="Address" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={3} required />
              <Textarea label="Note" value={buyerNote} onChange={(e) => setBuyerNote(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>
                  Save
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-1 text-sm">
              <p>{order.buyer_name}</p>
              <p>{order.buyer_phone}</p>
              <p>{order.buyer_address}</p>
              {order.buyer_note && <p className="text-neutral-600">{order.buyer_note}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentInstructions method={order.payment_method} />

      {order.payment_proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment proofs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {order.payment_proofs.map((proof) => (
                <div key={proof.id}>
                  <a href={resolveMediaUrl(proof.image_url)} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(proof.image_url)}
                      alt="Payment proof"
                      className="max-h-48 rounded-lg border border-neutral-200"
                    />
                  </a>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatDateTime(proof.uploaded_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {canUpload && (
        <PaymentProofUpload
          invoiceCode={order.invoice_code}
          defaultPassword={password}
          onSuccess={refreshOrder}
        />
      )}
    </div>
  );
}
