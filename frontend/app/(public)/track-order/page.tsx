"use client";

import { useState } from "react";
import { OrderTrackDetails } from "@/components/track/OrderTrackDetails";
import { TrackOrderForm } from "@/components/track/TrackOrderForm";
import type { OrderTrackResponse } from "@/types/public/order";

export default function TrackOrderPage() {
  const [order, setOrder] = useState<OrderTrackResponse | null>(null);
  const [password, setPassword] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Track your order</h1>
        <p className="mt-1 text-neutral-600">
          Enter the invoice code and password you received when you placed your order.
        </p>
      </div>

      {!order ? (
        <TrackOrderForm
          onSuccess={(o, pwd) => {
            setOrder(o);
            setPassword(pwd);
          }}
        />
      ) : (
        <>
          <button
            type="button"
            className="text-sm text-indigo-600 hover:underline"
            onClick={() => {
              setOrder(null);
              setPassword("");
            }}
          >
            Look up a different order
          </button>
          <OrderTrackDetails
            order={order}
            password={password}
            onUpdated={setOrder}
          />
        </>
      )}
    </div>
  );
}
