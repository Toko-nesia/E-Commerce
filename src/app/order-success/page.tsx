"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, isOrderStatus } from "@/domain/order-status";

interface OrderResult {
  id: string;
  midtrans_order_id: string | null;
  status: string;
  total_price: string | null;
  estimated_delivery: string | null;
  payment_status: string;
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState<string | null>(orderId ? null : "Order ID is missing.");

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetch(`/api/orders/${orderId}/result`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Failed to load order.");
        if (data.order?.payment_status === "pending") {
          router.replace(`/order-pending?orderId=${orderId}`);
          return;
        }
        setOrder(data.order);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order."))
      .finally(() => setLoading(false));
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
            <div className="bg-[#e8f5ee] rounded-full p-5">
              <CheckCircle size={52} className="text-[#15a15b]" />
            </div>
          </div>

          <h1 className="font-bold text-[26px] text-[#511e0b] mb-2">Order Placed!</h1>
          <p className="text-[14px] text-[#6b6b6b] mb-6">Thank you for shopping at Tokonesia. Your order is being processed.</p>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-[#6b6b6b] py-8">
              <Loader2 size={18} className="animate-spin" />
              Loading order...
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-[#df0000] rounded-xl p-4 mb-6 text-[13px]">
              {error}
            </div>
          )}

          {order && !loading && (
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
            </>
          )}

          <div className="h-px bg-[#e0e0e0] mb-8" />

          <div className="flex flex-col gap-3">
            <Link
              href={order?.id ? `/profile/orders/${order.id}` : "/profile"}
              className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors flex items-center justify-center gap-2"
            >
              <Package size={18} />
              View Your Order
            </Link>
            <Link
              href="/shop"
              className="w-full border border-[#511e0b] text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
