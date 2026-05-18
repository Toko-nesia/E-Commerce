"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Clock, Loader2, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, isOrderStatus } from "@/domain/order-status";

const PAID_STATUSES = new Set(["settlement", "capture"]);
const TERMINAL_FAILED_STATUSES = new Set(["cancel", "deny", "expire", "failure"]);
const CONFIRMATION_TIMEOUT_MS = 15_000;
const CONFIRMATION_POLL_MS = 1_500;

interface OrderResult {
  id: string;
  midtrans_order_id: string | null;
  status: string;
  total_price: string | null;
  estimated_delivery: string | null;
  payment_status: string;
  order_items?: Array<{
    id: number;
    product_id: number | null;
    quantity: number;
    price: string | null;
    price_raw: number | null;
    buyer_note?: string | null;
    products?: { name?: string | null; image?: string | null } | Array<{ name?: string | null; image?: string | null }> | null;
  }>;
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [confirming, setConfirming] = useState(false);
  const [confirmationTimedOut, setConfirmationTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(orderId ? null : "Order ID is missing.");

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function loadOrder(): Promise<OrderResult> {
      const res = await fetch(`/api/orders/${orderId}/result`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to load order.");
      return data.order;
    }

    async function syncPayment() {
      await fetch(`/api/orders/${orderId}/sync-payment`, { method: "POST" });
    }

    async function confirmPaidOrder(initialOrder: OrderResult) {
      setOrder(initialOrder);
      setLoading(false);
      setConfirming(true);
      setConfirmationTimedOut(false);
      const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;

      while (!cancelled && Date.now() < deadline) {
        await syncPayment().catch(() => undefined);
        const latest = await loadOrder();
        if (cancelled) return;

        if (PAID_STATUSES.has(latest.payment_status)) {
          setOrder(latest);
          setConfirming(false);
          return;
        }
        if (TERMINAL_FAILED_STATUSES.has(latest.payment_status)) {
          router.replace(`/order-failed?orderId=${orderId}`);
          return;
        }

        setOrder(latest);
        await new Promise((resolve) => window.setTimeout(resolve, CONFIRMATION_POLL_MS));
      }

      if (!cancelled) {
        setConfirming(false);
        setConfirmationTimedOut(true);
      }
    }

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const nextOrder = await loadOrder();
        if (cancelled) return;

        if (PAID_STATUSES.has(nextOrder.payment_status)) {
          setOrder(nextOrder);
          setLoading(false);
          return;
        }
        if (TERMINAL_FAILED_STATUSES.has(nextOrder.payment_status)) {
          router.replace(`/order-failed?orderId=${orderId}`);
          return;
        }

        await confirmPaidOrder(nextOrder);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load order.");
          setLoading(false);
          setConfirming(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const displayId = order?.midtrans_order_id ? `#${order.midtrans_order_id}` : order ? `#${order.id.slice(0, 8).toUpperCase()}` : "";
  const statusLabel = order && isOrderStatus(order.status) ? ORDER_STATUS_LABEL[order.status] : order?.status ?? "New";
  const statusColor = order && isOrderStatus(order.status) ? ORDER_STATUS_COLOR[order.status] : "bg-gray-100 text-gray-600";
  const paymentStatusLabel = (() => {
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
    return order?.payment_status ? labels[order.payment_status] ?? order.payment_status : "-";
  })();

  return (
    <div className="min-h-screen bg-[#FDF9F5] flex flex-col">
      <header className="bg-white h-20 flex items-center px-6 md:px-12 shadow-sm">
        <Link href="/" className="font-bold text-[18px] text-black tracking-tight no-underline flex items-center gap-2">
          <span>トコネシア</span>
          <span className="text-gray-300 font-normal">|</span>
          <span className="text-[#ba2f2f]">Tokonesia</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 max-w-[480px] w-full text-center">
          <div className="flex justify-center mb-6">
            <div className={`${confirmationTimedOut ? "bg-amber-50" : "bg-[#e8f5ee]"} rounded-full p-5`}>
              {confirmationTimedOut ? (
                <Clock size={52} className="text-amber-600" />
              ) : (
                <CheckCircle size={52} className="text-[#15a15b]" />
              )}
            </div>
          </div>

          <h1 className="font-bold text-[26px] text-[#511e0b] mb-2">
            {confirming ? "Confirming Payment" : confirmationTimedOut ? "Payment Still Pending" : "Order Placed!"}
          </h1>
          <p className="text-[14px] text-[#6b6b6b] mb-6">
            {confirming
              ? "We are confirming your payment with Midtrans. This usually takes a few seconds."
              : confirmationTimedOut
                ? "Your order is reserved, but payment confirmation is still being processed."
              : "Thank you for shopping at Tokonesia. Your order is being processed."}
          </p>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-[#6b6b6b] py-8">
              <Loader2 size={18} className="animate-spin" />
              Loading order...
            </div>
          )}
          {confirming && !loading && (
            <div className="flex items-center justify-center gap-2 text-[#6b6b6b] py-8">
              <Loader2 size={18} className="animate-spin" />
              Confirming your payment...
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-[#df0000] rounded-xl p-4 mb-6 text-[13px]">
              {error}
            </div>
          )}

          {confirmationTimedOut && order && !loading && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-[13px] text-left">
              Payment confirmation is still in progress. You can keep this order open from the pending payment page while Midtrans finishes confirming the transaction.
            </div>
          )}

          {order && !loading && !confirming && (
            <>
              <div className="bg-[#FDF9F5] rounded-xl px-6 py-4 mb-6 min-w-0">
                <p className="text-[12px] text-[#6b6b6b] uppercase tracking-wider mb-1">Order Number</p>
                <p className="font-bold text-[18px] sm:text-[22px] text-[#511e0b] break-all">{displayId}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <div className="bg-[#f8f8f8] rounded-xl p-4 text-left min-w-0">
                  <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Shipping</p>
                  <p className="text-[13px] font-medium text-black">Air Shipping</p>
                  <p className="text-[12px] text-[#6b6b6b] break-words">{order.estimated_delivery || "Calculated by FedEx"}</p>
                </div>
                <div className="bg-[#f8f8f8] rounded-xl p-4 text-left">
                  <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 mt-0.5 text-[12px] font-bold ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <p className="text-[12px] text-[#6b6b6b] mt-1">Will be processed shortly</p>
                </div>
              </div>

              <div className="bg-[#f8f8f8] rounded-xl p-4 text-left mb-6">
                <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-2">Payment</p>
                <p className="text-[13px] text-[#6b6b6b]">Payment status: <span className="font-semibold">{paymentStatusLabel}</span></p>
              </div>

              {order.order_items?.some((item) => item.buyer_note) && (
                <div className="bg-[#f8f8f8] rounded-xl p-4 text-left mb-6">
                  <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-2">Item notes</p>
                  <div className="space-y-3">
                    {order.order_items.filter((item) => item.buyer_note).map((item) => {
                      const product = Array.isArray(item.products) ? item.products[0] : item.products;
                      return (
                        <div key={item.id} className="min-w-0">
                          <p className="text-[13px] font-semibold text-black truncate">{product?.name ?? `Product ${item.product_id}`}</p>
                          <p className="text-[12px] text-[#6b6b6b] break-words">{item.buyer_note}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !confirming && (
            <>
              <div className="h-px bg-[#e0e0e0] mb-8" />

              <div className="flex flex-col gap-3">
                <Link
                  href={confirmationTimedOut && order?.id ? `/order-pending?orderId=${order.id}` : order?.id ? `/profile/orders/${order.id}` : "/profile"}
                  className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors flex items-center justify-center gap-2"
                >
                  <Package size={18} />
                  {confirmationTimedOut ? "Open Pending Payment" : "View Your Order"}
                </Link>
                <Link
                  href="/shop"
                  className="w-full border border-[#511e0b] text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  Continue Shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
