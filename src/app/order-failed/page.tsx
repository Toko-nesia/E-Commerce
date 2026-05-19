"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

interface PaymentOrder {
  id: string;
  midtrans_order_id: string | null;
  payment_status: string;
  status: string;
  total_price: string | null;
  total_price_raw: number | null;
  canContinuePayment: boolean;
}

function formatRp(amount: number | null | undefined, fallback?: string | null): string {
  if (fallback) return fallback;
  if (typeof amount !== "number") return "-";
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatPaymentStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Awaiting payment",
    settlement: "Paid",
    capture: "Paid",
    cancel: "Cancelled",
    deny: "Declined",
    expire: "Expired",
    failure: "Failed",
    refund: "Refunded",
  };
  return labels[status] ?? status;
}

export default function OrderFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [exchangeRate, setExchangeRate] = useState(0.0093);
  const isExpired = order?.payment_status === "expire" || order?.status === "PAYMENT_EXPIRED";

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetch(`/api/orders/${orderId}/payment`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) setOrder(data.order);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.rate) setExchangeRate(data.rate);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF9F5] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 max-w-[460px] w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 rounded-full p-5">
            <AlertTriangle size={52} className="text-[#df0000]" />
          </div>
        </div>
        <h1 className="font-bold text-[26px] text-[#511e0b] mb-2">{isExpired ? "Payment Expired" : "Payment Failed"}</h1>
        <p className="text-[14px] text-[#6b6b6b] mb-6">
          {isExpired
            ? "The payment window has expired. This transaction was cancelled and reserved stock has been returned."
            : "We could not complete the payment. If the order is still pending, you can continue the same payment."}
        </p>
        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner label="Checking payment..." className="text-[#6b6b6b]" />
          </div>
        )}
        {orderId && (
          <div className="bg-[#FDF9F5] rounded-xl px-4 py-3 mb-6">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Order Reference</p>
            <p className="font-bold text-[13px] text-[#511e0b] break-all">#{orderId}</p>
            {order && (
              <>
                <p className="text-[12px] text-[#6b6b6b] mt-2">Payment status: {formatPaymentStatus(order.payment_status)}</p>
                <p className="text-[13px] font-semibold text-[#511e0b] mt-1">{formatRp(order.total_price_raw, order.total_price)}</p>
                {order.total_price_raw && (
                  <p className="text-[12px] font-semibold text-[#df0000] mt-0.5">
                    ≈ ¥{Math.round(order.total_price_raw * exchangeRate).toLocaleString("ja-JP")}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3">
          {order?.canContinuePayment ? (
            <Link href={`/order-pending?orderId=${order.id}`} className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors">
              Continue Payment
            </Link>
          ) : order?.id ? (
            <Link href={`/profile/orders/${order.id}`} className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors flex items-center justify-center gap-2">
              <Package size={18} />
              View Your Order
            </Link>
          ) : (
            <Link href="/shop" className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors">
              Start Shopping
            </Link>
          )}
          <Link href="/shop" className="w-full border border-[#511e0b] text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
