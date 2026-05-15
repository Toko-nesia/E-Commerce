"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageWrapper } from "@/app/components/layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, ArrowLeft, Package, MapPin, Receipt, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Order, FedExLatestStatus, Address } from "@/types/database";
import { mapScanEventsToTimeline, TimelineStep } from "@/app/components/modals/trackingUtils";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, REFUND_STATUS_LABEL, type RefundStatus } from "@/domain/order-status";
import { resolveImagePath } from "@/lib/image-paths";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Tracking / FedEx State
  const [trackingState, setTrackingState] = useState<"loading" | "found" | "not_found" | "idle">("idle");
  const [trackingSteps, setTrackingSteps] = useState<TimelineStep[]>([]);
  const [refundRequest, setRefundRequest] = useState<{
    id: string;
    status: RefundStatus;
    reason: string;
    rejection_reason?: string | null;
    account_name?: string | null;
    payout_provider?: string | null;
    account_number?: string | null;
  } | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<"bank_transfer" | "e_wallet">("bank_transfer");
  const [payoutProvider, setPayoutProvider] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!order?.tracking_number) {
      setTrackingState("idle");
      return;
    }
    
    // fetch from our proxy API to avoid exposing secrets
    setTrackingState("loading");
    setTrackingSteps([]);
    
    fetch(`/api/shipping/track?tracking_number=${order.tracking_number}`)
      .then((res) => {
         if (!res.ok) throw new Error("Tracking fetch failed");
         return res.json();
      })
      .then((response) => {
         const trackResult = response.output?.completeTrackResults?.[0]?.trackResults?.[0];
         
         if (!trackResult) {
            setTrackingState("not_found");
            return;
         }

         const { scanEvents, latestStatusDetail } = trackResult;
         const latestStatus: FedExLatestStatus | undefined = latestStatusDetail;

         let timeline = mapScanEventsToTimeline(scanEvents ?? [], latestStatus?.code);
         timeline = timeline.reverse();

         setTrackingSteps(timeline);
         setTrackingState("found");
      })
      .catch(() => {
         setTrackingState("not_found");
      });
  }, [order?.tracking_number]);

  useEffect(() => {
    const fetchOrder = async () => {
      // Tunggu client mount / id ready
      if (!user?.id || !orderId) {
          if (!user?.id) setLoading(false);
          return;
      }
      try {
        const { data, error: dbError } = await supabase
          .from("orders")
          .select(`
            *,
            items:order_items (
              id,
              quantity,
              price,
              product:products (
                name,
                image
              )
            )
          `)
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();

        if (dbError) throw dbError;
        setOrder(data);
        const snapshot = data.address_snapshot as Partial<Address> | null;
        setAddress(snapshot?.name ? snapshot as Address : null);

        const { data: refundData } = await supabase
          .from("refund_requests")
          .select("id, status, reason, rejection_reason, account_name, payout_provider, account_number")
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setRefundRequest((refundData as any) ?? null);
      } catch (err: any) {
        setError(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [user?.id, orderId, supabase]);

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim() || !["BARU", "DIPROSES", "DIKIRIM"].includes(order.status)) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancellation-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to request cancellation.");
      setOrder({ ...order, status: "CANCEL_REQUESTED", cancel_reason: cancelReason.trim() });
      setShowCancelInput(false);
      setCancelReason("");
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "Failed to request cancellation. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubmitPayout = async () => {
    if (!refundRequest) return;
    setPayoutSaving(true);
    setPayoutError(null);
    try {
      const res = await fetch(`/api/refunds/${refundRequest.id}/payout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundMethod: payoutMethod,
          payoutProvider,
          accountName: payoutAccountName,
          accountNumber: payoutAccountNumber,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to submit payout details.");
      setRefundRequest({ ...refundRequest, status: "awaiting_manual_transfer", account_name: payoutAccountName, payout_provider: payoutProvider, account_number: payoutAccountNumber });
      if (order) setOrder({ ...order, status: "REFUND_INFO_SUBMITTED" });
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : "Failed to submit payout details.");
    } finally {
      setPayoutSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
          <Loader2 size={32} className="animate-spin text-[#511e0b] mb-4" />
          <span className="text-[14px] text-[#6b6b6b]">Loading order details...</span>
        </div>
      </PageWrapper>
    );
  }

  if (error || !order) {
    return (
      <PageWrapper>
        <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-10">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[#511e0b] font-bold text-[14px] hover:underline mb-8">
            <ArrowLeft size={16} /> Back to Profile
          </Link>
          <div className="bg-red-50 text-[#df0000] p-4 rounded-lg flex justify-center border border-red-200">
            {error || "Order not found."}
          </div>
        </div>
      </PageWrapper>
    );
  }

  const displayId = order.midtrans_order_id ? `#${order.midtrans_order_id}` : `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <PageWrapper>
      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-10">
        <Link href="/profile" className="inline-flex items-center gap-2 text-[#511e0b] font-bold text-[14px] hover:underline mb-8 transition-opacity hover:opacity-80">
          <ArrowLeft size={16} /> Back to History
        </Link>
        <h1 className="font-bold text-[32px] md:text-[44px] text-[#3a302a] mb-8 leading-tight tracking-[-1px] font-['Inter']">
          Order Details
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-stretch">
          {/* Left Column: Tracking & Basic details */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Status & ID */}
              <div className="border border-[#511e0b] rounded-[8px] p-[32px] flex flex-col justify-between bg-white overflow-hidden min-h-[199px]">
                <div>
                  <p className="text-[12px] text-[#605850] opacity-90 tracking-[2.4px] uppercase font-['Inter'] mb-2">Order ID</p>
                  <p className="text-[18px] md:text-[24px] font-normal text-[#3a302a] leading-[1.2] break-all max-w-full">{displayId}</p>
                </div>
                <div className="mt-6 flex flex-col items-start">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold w-fit max-w-full ${ORDER_STATUS_COLOR[order.status as keyof typeof ORDER_STATUS_COLOR] ?? "bg-gray-100 text-gray-500"}`}>
                    <span className="truncate">{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}</span>
                  </span>
                  <p className="text-[14px] text-[#a6a6a6] mt-2 font-medium tracking-tight">
                    Ordered: {new Date(order.created_at || new Date().toISOString()).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Delivery info */}
              <div className="bg-[#511e0b] text-white rounded-[8px] p-[32px] flex flex-col justify-between shadow-sm min-h-[199px]">
                <div>
                  <p className="text-[12px] opacity-80 tracking-[2.4px] uppercase font-['Inter'] mb-2">Tracking No / AWB</p>
                  <p className="text-[18px] md:text-[24px] font-normal italic font-['EB_Garamond'] opacity-100 leading-[1.2] break-all">
                    {order.tracking_number || "Awaiting Tracking No"}
                  </p>
                </div>
                {order.estimated_delivery && (
                  <div className="mt-8 flex justify-between items-end">
                    <div>
                        <p className="text-[11px] opacity-80 uppercase tracking-widest mb-1">Est. Delivery</p>
                        <p className="text-[15px] italic font-['EB_Garamond']">{order.estimated_delivery}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address & Note Info */}
            <div className="bg-white border border-[#d5d5d5] rounded-xl p-6 flex flex-col gap-6">
              
              {/* Shipping Address */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={18} className="text-[#511e0b]" />
                  <h3 className="font-bold text-[16px] text-[#3a302a]">Shipping Address</h3>
                </div>
                {address ? (
                  <div className="text-[14px] text-[#6b6b6b] space-y-1">
                    <p className="font-bold text-[#3a302a]">{address.name} <span className="font-normal opacity-70">({address.phone})</span></p>
                    <p>{address.full_address || address.address}</p>
                    {address.postal_code && <p>Postal Code: {address.postal_code}</p>}
                  </div>
                ) : (
                  <p className="text-[14px] text-[#a6a6a6] italic">No address details available.</p>
                )}
              </div>

              {((order.note && order.note.trim() !== '') || order.payment_method) && (
                <>
                  <div className="h-px bg-[#f0f0f0] w-full" />
                  <div className="flex flex-col md:flex-row gap-6">
                    {order.payment_method && (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt size={18} className="text-[#511e0b]" />
                          <h3 className="font-bold text-[16px] text-[#3a302a]">Payment Option</h3>
                        </div>
                        <p className="text-[14px] text-[#6b6b6b] capitalize">{order.payment_method.replace('_', ' ')}</p>
                      </div>
                    )}
                    {order.note && order.note.trim() !== '' && (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={18} className="text-[#511e0b]" />
                          <h3 className="font-bold text-[16px] text-[#3a302a]">Customer Note</h3>
                        </div>
                        <p className="text-[14px] text-[#6b6b6b] italic">&quot;{order.note}&quot;</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Ordered Items Section */}
            <div className="bg-white border text-left border-[#d5d5d5] rounded-xl p-6">
              <h2 className="font-bold text-[18px] text-[#3a302a] mb-4">Items in Order</h2>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-[#f0f0f0] last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-[#f5f0ea] rounded-md overflow-hidden flex items-center justify-center shrink-0">
                      {item.product?.image ? (
                        <Image
                          src={resolveImagePath(item.product.image)}
                          alt={item.product?.name || "Product"}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full mix-blend-multiply"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-8 h-8 text-[#511e0b] opacity-50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[14px] text-[#3a302a] line-clamp-2">{item.product?.name}</p>
                      <p className="text-[13px] text-[#6b6b6b] mt-1">{item.quantity} x {item.price}</p>
                    </div>
                    <div className="font-bold text-[15px] text-[#511e0b]">
                      {item.price}
                    </div>
                  </div>
                ))}
                {!order.items?.length && (
                  <p className="text-center text-sm text-gray-500 py-4">No items record found.</p>
                )}
              </div>
            </div>

            {/* Order Payment Summary */}
            <div className="bg-[#f5f0ea] rounded-[8px] p-[24px] border border-[#e6e0d8] space-y-3">
               <div className="flex justify-between items-center text-[#3a302a] text-[14px]">
                  <span className="ml-2">Subtotal for Products</span>
                  <span className="pr-2">{order.total_price_raw && order.shipping_cost !== undefined ? `Rp ${(order.total_price_raw - (order.shipping_cost || 0) - (order.service_fee || 0)).toLocaleString("id-ID")}` : "-"}</span>
               </div>
               <div className="flex justify-between items-center text-[#3a302a] text-[14px]">
                  <span className="ml-2">Shipping Information</span>
                  <span className="pr-2">{order.shipping_cost ? `Rp ${order.shipping_cost.toLocaleString("id-ID")}` : "Rp 0"}</span>
               </div>
               <div className="flex justify-between items-center text-[#3a302a] text-[14px]">
                  <span className="ml-2">Service Fee</span>
                  <span className="pr-2">{order.service_fee ? `Rp ${order.service_fee.toLocaleString("id-ID")}` : "Rp 0"}</span>
               </div>
               <div className="h-px bg-[#d8d0c8] my-3" />
               <div className="flex justify-between items-center text-[#3a302a]">
                  <span className="text-[16px] ml-2 font-bold">Total Payment</span>
                  <span className="text-[24px] font-bold pr-2 text-[#511e0b]">{order.total_price}</span>
               </div>
            </div>

            {/* Cancel Section */}
            {["BARU", "DIPROSES", "DIKIRIM"].includes(order.status) && (
              <div className="bg-white border text-center border-[#d5d5d5] rounded-xl p-6 mt-4">
                {!showCancelInput ? (
                  <button
                    onClick={() => { setShowCancelInput(true); setCancelError(null); }}
                    className="w-full bg-white border border-[#df0000] text-[#df0000] rounded-lg py-3 font-bold text-[14px] border-solid cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    Request Cancellation
                  </button>
                ) : (
                  <div className="space-y-4 text-left">
                    <label className="block text-[13px] font-bold text-black">Cancellation Reason</label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Enter cancellation reason..."
                      rows={3}
                      className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#511e0b] resize-none"
                    />
                    {cancelError && <p className="text-[12px] text-[#df0000]">{cancelError}</p>}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setShowCancelInput(false); setCancelReason(""); setCancelError(null); }}
                        className="flex-1 py-2.5 rounded-lg text-[14px] font-medium border border-[#b0b0b0] bg-white text-black cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCancelOrder}
                        disabled={cancelLoading || !cancelReason.trim()}
                        className="flex-1 py-2.5 rounded-lg text-[14px] font-medium border-none bg-[#df0000] text-white cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {cancelLoading && <Loader2 size={14} className="animate-spin" />}
                        Submit Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {refundRequest && (
              <div className="bg-white border text-left border-[#d5d5d5] rounded-xl p-6 mt-4">
                <h2 className="font-bold text-[18px] text-[#3a302a] mb-2">Cancellation & Refund</h2>
                <p className="text-[13px] text-[#6b6b6b] mb-3">
                  Status: <span className="font-semibold text-[#511e0b]">{REFUND_STATUS_LABEL[refundRequest.status] ?? refundRequest.status}</span>
                </p>
                <p className="text-[13px] text-[#6b6b6b] mb-4">Reason: {refundRequest.reason}</p>
                {refundRequest.rejection_reason && (
                  <p className="text-[13px] text-[#df0000] mb-4">Rejected: {refundRequest.rejection_reason}</p>
                )}

                {refundRequest.status === "awaiting_buyer_payout" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-bold text-black mb-1.5">Refund Method</label>
                        <select
                          value={payoutMethod}
                          onChange={(event) => setPayoutMethod(event.target.value as "bank_transfer" | "e_wallet")}
                          className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#511e0b] bg-white"
                        >
                          <option value="bank_transfer">Bank transfer</option>
                          <option value="e_wallet">E-wallet</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-black mb-1.5">Bank / E-wallet Provider</label>
                        <input value={payoutProvider} onChange={(event) => setPayoutProvider(event.target.value)} className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#511e0b]" placeholder="BCA, Mandiri, GoPay..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-bold text-black mb-1.5">Account Name</label>
                        <input value={payoutAccountName} onChange={(event) => setPayoutAccountName(event.target.value)} className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#511e0b]" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-black mb-1.5">Account / Wallet Number</label>
                        <input value={payoutAccountNumber} onChange={(event) => setPayoutAccountNumber(event.target.value)} className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#511e0b]" />
                      </div>
                    </div>
                    {payoutError && <p className="text-[12px] text-[#df0000]">{payoutError}</p>}
                    <button
                      onClick={handleSubmitPayout}
                      disabled={payoutSaving || !payoutProvider.trim() || !payoutAccountName.trim() || !payoutAccountNumber.trim()}
                      className="w-full bg-[#511e0b] text-white rounded-lg py-3 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {payoutSaving && <Loader2 size={14} className="animate-spin" />}
                      Submit Refund Details
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Timeline / History */}
          <div className="w-full lg:w-[420px] 2xl:w-[480px] shrink-0">
            <div className="bg-[#f2ece4] border border-[rgba(216,208,200,0.3)] rounded-[12px] pt-[32px] px-[32px] pb-[40px] h-full flex flex-col max-h-[85vh] sticky top-24">
              <h3 className="font-['EB_Garamond',serif] font-normal text-[#3a302a] text-[24px] mb-8 leading-tight shrink-0">
                Delivery History
              </h3>
              
              <div className="relative pl-[40px] z-0 overflow-y-auto flex-1 pr-4 custom-scrollbar">
                <div className="absolute left-[11px] top-[8px] bottom-[20px] w-px bg-[#d8d0c8] z-[-1]" />

                {trackingState === "loading" && (
                  <div className="flex flex-col gap-4 py-4 pr-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-gray-200 mt-1 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-1/3" />
                          <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {trackingState === "not_found" && (
                   <p className="text-sm text-gray-500 mb-8 w-full text-center pr-6">Tracking data is unavailable or tracking number is invalid. Please check again later.</p>
                )}

                {trackingState === "found" && trackingSteps.length > 0 && (
                  <>
                    {/* Render actual tracking events from API */}
                    {trackingSteps.map((step, index) => {
                       const isFirst = index === 0;
                       return (
                         <div key={index} className={`relative mb-8 ${!isFirst ? "opacity-60" : ""}`}>
                           <div className={`absolute left-[-40px] top-[4px] size-[22px] rounded-full border-4 border-[#faf5ee] z-10 ${isFirst ? "bg-[#c2652a]" : "bg-[#d8d0c8]"}`} />
                           <div className={`${isFirst ? "bg-[#faf5ee] border border-[rgba(194,101,42,0.2)] rounded-[8px] p-[17px] shadow-sm" : ""}`}>
                             <p className={`text-[10px] tracking-[1px] uppercase font-['Manrope'] mb-1.5 ${isFirst ? "text-[#c2652a]" : "text-[#605850]"}`}>
                               {step.timestamp}
                             </p>
                             <p className={`text-[18px] mb-1 font-normal font-['EB_Garamond'] leading-snug ${isFirst ? "text-[#3a302a]" : "text-[#3a302a]"}`}>
                               {step.label}
                             </p>
                             <p className="text-[#605850] text-[14px] font-['Manrope']">
                               {step.location || step.description}
                             </p>
                           </div>
                         </div>
                       );
                    })}
                  </>
                )}

                {/* E-commerce data - Always appended at the bottom to show order lifecycle events */}
                <div className={`relative mb-8 ${trackingSteps.length > 0 || trackingState === "loading" ? "opacity-60" : ""}`}>
                  <div className={`absolute left-[-40px] top-[4px] size-[22px] rounded-full border-4 border-[#faf5ee] z-10 ${(order.status === "DIPROSES" && trackingSteps.length === 0 && trackingState !== "loading") ? "bg-[#c2652a]" : "bg-[#d8d0c8]"}`} />
                  <div className={`${(order.status === "DIPROSES" && trackingSteps.length === 0 && trackingState !== "loading") ? "bg-[#faf5ee] border border-[rgba(194,101,42,0.2)] rounded-[8px] p-[17px] shadow-sm" : ""}`}>
                    <p className={`text-[10px] tracking-[1px] uppercase font-['Manrope'] mb-1.5 ${(order.status === "DIPROSES" && trackingSteps.length === 0 && trackingState !== "loading") ? "text-[#c2652a]" : "text-[#605850]"}`}>
                      {(order.status === "DIKIRIM" || order.status === "SELESAI" || order.status === "DIBATALKAN" || trackingSteps.length > 0 || trackingState === "loading") ? "PREVIOUS" : "LATEST"}
                    </p>
                    {order.status === "DIBATALKAN" ? (
                      <p className="text-[#df0000] text-[18px] font-normal leading-snug mb-1 font-['EB_Garamond']">Order Cancelled</p>
                    ) : (
                      <>
                        <p className="text-[#3a302a] text-[18px] font-normal leading-snug mb-1 font-['EB_Garamond']">Order Processing</p>
                        <p className="text-[#605850] text-[14px] font-['Manrope']">Quality check & packaging</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative opacity-40">
                  <div className="absolute left-[-40px] top-[4px] size-[22px] bg-[#d8d0c8] rounded-full border-4 border-[#faf5ee] z-10" />
                  <div>
                    <p className="text-[#605850] text-[10px] tracking-[1px] uppercase font-['Manrope'] mb-1.5">
                      {new Date(order.created_at || new Date().toISOString()).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-[#3a302a] text-[18px] leading-snug mb-1 font-['EB_Garamond']">Order Created</p>
                    <p className="text-[#605850] text-[14px] font-['Manrope']">Payment verified</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
