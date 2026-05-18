"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, CreditCard, Package, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { useCart } from "@/contexts/cart-context";

interface PendingOrderItem {
  id: number;
  product_id: number | null;
  quantity: number;
  price: string | null;
  price_raw: number | null;
  products?: { name?: string | null; image?: string | null } | Array<{ name?: string | null; image?: string | null }> | null;
}

interface PendingOrder {
  id: string;
  midtrans_order_id: string | null;
  payment_status: string;
  status: string;
  total_price: string | null;
  total_price_raw: number | null;
  snap_token: string | null;
  snap_token_expires_at: string | null;
  canContinuePayment: boolean;
  isExpired: boolean;
  order_items?: PendingOrderItem[];
}

const PAID_STATUSES = new Set(["settlement", "capture"]);
const TERMINAL_FAILED_STATUSES = new Set(["cancel", "deny", "expire", "failure"]);

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

function formatRp(amount: number | null | undefined, fallback?: string | null): string {
  if (fallback) return fallback;
  if (typeof amount !== "number") return "-";
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

async function loadSnapScript() {
  if (window.snap) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-midtrans-snap]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Midtrans Snap")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
    script.setAttribute("data-midtrans-snap", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
    document.head.appendChild(script);
  });
}

export default function OrderPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [processing, setProcessing] = useState(false);
  const [expiring, setExpiring] = useState(false);
  const [error, setError] = useState<string | null>(orderId ? null : "Order ID is missing.");
  const [now, setNow] = useState(() => Date.now());

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to load payment.");
      const nextOrder = data.order as PendingOrder | null;

      if (nextOrder && PAID_STATUSES.has(nextOrder.payment_status)) {
        router.replace(`/order-success?orderId=${orderId}`);
        return;
      }
      if (nextOrder && TERMINAL_FAILED_STATUSES.has(nextOrder.payment_status)) {
        router.replace(`/order-failed?orderId=${orderId}`);
        return;
      }

      if (nextOrder?.payment_status === "pending") {
        const syncRes = await fetch(`/api/orders/${orderId}/sync-payment`, { method: "POST" }).catch(() => null);
        if (syncRes?.ok) {
          const syncData = await syncRes.json().catch(() => ({}));
          const syncedPaymentStatus = syncData.order?.paymentStatus as string | undefined;
          if (syncedPaymentStatus && PAID_STATUSES.has(syncedPaymentStatus)) {
            router.replace(`/order-success?orderId=${orderId}`);
            return;
          }
          if (syncedPaymentStatus && TERMINAL_FAILED_STATUSES.has(syncedPaymentStatus)) {
            router.replace(`/order-failed?orderId=${orderId}`);
            return;
          }

          const latestRes = await fetch(`/api/orders/${orderId}/payment`, { cache: "no-store" });
          const latestData = await latestRes.json().catch(() => ({}));
          if (latestRes.ok && latestData.order) {
            setOrder(latestData.order);
            return;
          }
        }
      }

      setOrder(nextOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expiresAtMs = order?.snap_token_expires_at ? new Date(order.snap_token_expires_at).getTime() : null;
  const remainingMs = expiresAtMs ? expiresAtMs - now : 0;
  const expired = !!order && (order.isExpired || remainingMs <= 0);

  useEffect(() => {
    if (!order || !expired || expiring || order.payment_status !== "pending") return;
    setExpiring(true);
    fetch(`/api/orders/${order.id}/expire-pending-payment`, { method: "POST" })
      .then(() => fetchOrder())
      .finally(() => setExpiring(false));
  }, [expired, expiring, fetchOrder, order]);

  const displayId = order?.midtrans_order_id ? `#${order.midtrans_order_id}` : order ? `#${order.id.slice(0, 8).toUpperCase()}` : "";
  const items = useMemo(() => order?.order_items ?? [], [order?.order_items]);

  async function continuePayment() {
    if (!order?.snap_token || !order.canContinuePayment || expired || processing) return;
    setProcessing(true);
    setError(null);
    try {
      await loadSnapScript();
      window.snap!.pay(order.snap_token, {
        onSuccess: () => router.replace(`/order-success?orderId=${order.id}`),
        onPending: () => fetchOrder(),
        onError: () => router.replace(`/order-failed?orderId=${order.id}`),
        onClose: () => setProcessing(false),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue payment.");
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF9F5] flex flex-col">
      <header className="bg-white h-20 flex items-center px-6 md:px-12 shadow-sm">
        <Link href="/" className="font-bold text-[18px] text-black tracking-tight no-underline flex items-center gap-2">
          <span className="text-[#ba2f2f]">Tokonesia</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 max-w-[560px] w-full">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-amber-50 rounded-full p-5">
                <Clock size={52} className="text-amber-600" />
              </div>
            </div>
            <h1 className="font-bold text-[26px] text-[#511e0b] mb-2">Payment Pending</h1>
            <p className="text-[14px] text-[#6b6b6b] mb-6">
              Your order has been reserved. Complete the Virtual Account payment before the timer expires.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner label="Loading payment..." className="text-[#6b6b6b]" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-[#df0000] rounded-xl p-4 mb-6 text-[13px]">
              {error}
            </div>
          )}

          {order && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="bg-[#FDF9F5] rounded-xl px-4 py-3 min-w-0">
                  <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Order Number</p>
                  <p className="font-bold text-[14px] text-[#511e0b] break-all">{displayId}</p>
                </div>
                <div className="bg-[#FDF9F5] rounded-xl px-4 py-3">
                  <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Time Remaining</p>
                  <p className={`font-bold text-[18px] ${expired ? "text-[#df0000]" : "text-[#511e0b]"}`}>
                    {formatRemaining(remainingMs)}
                  </p>
                </div>
              </div>

              <div className="bg-[#f8f8f8] rounded-xl p-4 mb-5">
                <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-3">Items</p>
                <div className="space-y-3">
                  {items.map((item) => {
                    const product = Array.isArray(item.products) ? item.products[0] : item.products;
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black truncate">{product?.name ?? `Product ${item.product_id}`}</p>
                          <p className="text-[12px] text-[#6b6b6b]">Qty {item.quantity}</p>
                        </div>
                        <p className="text-[13px] font-semibold text-[#511e0b] shrink-0">
                          {formatRp(item.price_raw ? item.price_raw * item.quantity : null)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#f8f8f8] rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-[#6b6b6b]">Total Payment</span>
                  <span className="font-bold text-[18px] text-[#511e0b]">{formatRp(order.total_price_raw, order.total_price)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[13px] text-[#6b6b6b]">
                  <CreditCard size={15} />
                  Virtual Account
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={continuePayment}
                  disabled={!order.canContinuePayment || expired || processing}
                  className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? <LoadingSpinner label="Opening payment..." /> : "Continue Virtual Account Payment"}
                </button>
                <Link href={`/profile/orders/${order.id}`} className="w-full border border-[#511e0b] text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2">
                  <Package size={18} />
                  View Your Order
                </Link>
                <Link href="/shop" className="w-full border border-transparent text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2">
                  <ShoppingBag size={18} />
                  Continue Shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
