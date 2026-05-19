"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateTrackingNumber } from "@/lib/fedex/service";
import {
  type OrderStatus,
  getValidAdminNextStatuses,
  requiresTrackingNumber,
  requiresCancelReason,
} from "@/lib/order-status-utils";
import { ORDER_STATUSES, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/domain/order-status";

interface OrderRow {
  id: string;
  created_at: string;
  status: OrderStatus;
  total_price: string;
  tracking_number?: string | null;
  shipping_method?: string | null;
  cancel_reason?: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
  order_items: Array<{ quantity: number; buyer_note?: string | null; products: { name: string } | null }>;
  order_status_events?: Array<{ id: string; title: string; description: string; actor_type: string; created_at: string }>;
}

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  ...ORDER_STATUSES.map((status) => ({ label: ORDER_STATUS_LABEL[status], value: status })),
];

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function adminActionLabel(status: OrderStatus): string {
  if (status === "CANCEL_APPROVED") return "Cancel with reason";
  if (status === "DIKIRIM") return "Set shipment";
  return ORDER_STATUS_LABEL[status] ?? status;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("BARU");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: string, pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/admin/orders/complete-overdue", { method: "POST" }).catch(() => undefined);
      const supabase = createClient();
      let query = supabase
        .from("orders")
        .select("id, created_at, status, total_price, tracking_number, shipping_method, cancel_reason, profiles(full_name, email), order_items(quantity, buyer_note, products(name)), order_status_events(id, title, description, actor_type, created_at)")
        .order("created_at", { ascending: false })
        .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);

      if (status) query = query.eq("status", status);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const rows = (data ?? []) as unknown as OrderRow[];
      setHasMore(rows.length > PAGE_SIZE);
      setOrders(rows.length > PAGE_SIZE ? rows.slice(0, PAGE_SIZE) : rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setPage(0); fetchOrders(activeTab, 0); }, [activeTab, fetchOrders]);
  useEffect(() => { if (page > 0) fetchOrders(activeTab, page); }, [page, activeTab, fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
      setTrackingInput(selectedOrder.tracking_number ?? "");
      setTrackingError(""); setCancelReason(""); setCancelReasonError(""); setSaveError(null);
    }
  }, [selectedOrder]);

  const validNextStatuses = useMemo(() => selectedOrder ? getValidAdminNextStatuses(selectedOrder.status) : [], [selectedOrder]);
  const showTrackingInput = requiresTrackingNumber(newStatus, selectedOrder?.shipping_method);
  const showCancelReason = requiresCancelReason(newStatus);

  async function handleSave() {
    if (!selectedOrder) return;
    if (showTrackingInput) {
      if (!trackingInput.trim()) { setTrackingError("Tracking number is required."); return; }
      if (!validateTrackingNumber(trackingInput.trim())) { setTrackingError("Invalid tracking number. Min 12 alphanumeric chars."); return; }
    }
    if (showCancelReason && !cancelReason.trim()) { setCancelReasonError("Cancellation reason is required."); return; }

    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: showTrackingInput ? trackingInput.trim() : undefined,
          cancelReason: showCancelReason ? cancelReason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update order status.");

      await fetchOrders(activeTab, page);
      setShowModal(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-bold text-[20px] text-black">Incoming Orders</h1>
        <p className="text-[13px] text-[#6b6b6b] mt-1">Review paid orders, pending payments, and fulfillment progress.</p>
      </div>
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 border-b border-[#d0d0d0] bg-[#fafafa]">
          <label htmlFor="order-status-filter" className="text-[13px] font-medium text-[#3a302a]">
            Filter by status
          </label>
          <select
            id="order-status-filter"
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value)}
            className="w-full sm:w-[260px] border border-[#d0d0d0] rounded px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-[#511E0B] bg-white cursor-pointer"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="text-center text-[13px] text-[#6b6b6b] py-12">Loading orders…</div>}
        {!loading && error && <div className="text-center text-[13px] text-red-500 py-12">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#d0d0d0]">
                  {["Order No.", "Date", "Customer", "Product", "Qty", "Total", "Status", "Tracking No.", "Action"].map((h) => (
                    <th key={h} className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-[13px] text-[#6b6b6b] py-12">No orders found.</td></tr>
                ) : orders.map((order) => {
                  const firstItem = order.order_items?.[0];
                  return (
                    <tr key={order.id} className="border-b border-[#d0d0d0] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-[13px] text-black font-medium whitespace-nowrap">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">{order.profiles?.full_name ?? order.profiles?.email ?? "-"}</td>
                      <td className="px-4 py-4 text-[13px] text-black max-w-[200px]"><span className="line-clamp-2">{firstItem?.products?.name ?? "-"}</span></td>
                      <td className="px-4 py-4 text-[13px] text-black text-center">{firstItem?.quantity ?? 0}</td>
                      <td className="px-4 py-4 text-[13px] text-black font-medium whitespace-nowrap">{order.total_price}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-[12px] font-bold whitespace-nowrap ${ORDER_STATUS_COLOR[order.status as keyof typeof ORDER_STATUS_COLOR] ?? "bg-gray-100 text-gray-500"}`}>{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}</span>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">{order.tracking_number || "-"}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                          className="text-[#511E0B] text-[13px] bg-transparent border-none cursor-pointer hover:underline font-medium whitespace-nowrap">
                          View Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#d0d0d0]">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="text-[13px] px-3 py-1 rounded border border-[#d0d0d0] disabled:opacity-40 cursor-pointer hover:bg-gray-50">Previous</button>
            <span className="text-[13px] text-[#6b6b6b]">Page {page + 1}</span>
            <button type="button" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}
              className="text-[13px] px-3 py-1 rounded border border-[#d0d0d0] disabled:opacity-40 cursor-pointer hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-w-[520px] w-full mx-4 bg-white rounded shadow-lg p-8">
            <button type="button" onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#6b6b6b] hover:text-black p-0" aria-label="Close">
              <X size={20} />
            </button>
            <h2 className="font-bold text-[17px] mb-4">Order Details</h2>
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
              <span className="text-[#6b6b6b]">Order No.</span><span className="font-medium">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
              <span className="text-[#6b6b6b]">Date</span><span>{formatDate(selectedOrder.created_at)}</span>
              <span className="text-[#6b6b6b]">Customer</span><span>{selectedOrder.profiles?.full_name ?? selectedOrder.profiles?.email ?? "-"}</span>
              <span className="text-[#6b6b6b]">Shipping</span><span>{selectedOrder.shipping_method === "internal_courier" ? "Internal Courier" : "FedEx"}</span>
              <span className="text-[#6b6b6b]">Total</span><span className="font-medium">{selectedOrder.total_price}</span>
            </div>

            <div className="mt-4">
              <p className="font-bold text-[13px] mb-2">Items</p>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {selectedOrder.order_items?.map((item, index) => (
                  <div key={`${item.products?.name ?? "item"}-${index}`} className="rounded border border-[#e0e0e0] p-3 text-[13px]">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium text-black break-words">{item.products?.name ?? "-"}</span>
                      <span className="text-[#6b6b6b] shrink-0">Qty {item.quantity}</span>
                    </div>
                    {item.buyer_note && (
                      <p className="mt-2 text-[12px] text-[#6b6b6b] break-words">
                        <span className="font-semibold text-[#511E0B]">Item note:</span> {item.buyer_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.status === "DIBATALKAN" && selectedOrder.cancel_reason && (
              <div className="mt-3 p-3 bg-red-50 rounded text-[13px]">
                <span className="font-bold text-red-600">Cancellation Reason: </span>
                <span className="text-red-700">{selectedOrder.cancel_reason}</span>
              </div>
            )}

            {selectedOrder.order_status_events && selectedOrder.order_status_events.length > 0 && (
              <div className="mt-4">
                <p className="font-bold text-[13px] mb-2">Order History</p>
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  {[...selectedOrder.order_status_events]
                    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
                    .map((event) => (
                      <div key={event.id} className="rounded border border-[#e0e0e0] p-3 text-[12px]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-black">{event.title}</span>
                          <span className="text-[#6b6b6b] shrink-0 capitalize">{event.actor_type.replace("_", " ")}</span>
                        </div>
                        <p className="text-[#6b6b6b] mt-1">{event.description}</p>
                        <p className="text-[#9a9a9a] mt-1">
                          {new Date(event.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#d0d0d0] my-4" />

            {selectedOrder.status === "PAYMENT_PENDING" ? (
              <p className="text-[13px] text-[#6b6b6b]">Payment is still pending. Seller actions are unavailable until the payment is confirmed.</p>
            ) : validNextStatuses.length === 0 ? (
              <p className="text-[13px] text-[#6b6b6b]">No seller action is available for this state (<strong>{ORDER_STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status}</strong>).</p>
            ) : (
              <>
                <p className="font-bold text-[13px] mb-2">Change Status</p>
                <select value={newStatus} onChange={(e) => { setNewStatus(e.target.value as OrderStatus); setTrackingError(""); setCancelReasonError(""); }}
                  className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] w-full outline-none focus:border-[#511E0B] bg-white cursor-pointer">
                  <option value={selectedOrder.status}>{ORDER_STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status} (current)</option>
                  {validNextStatuses.map((s) => <option key={s} value={s}>{adminActionLabel(s)}</option>)}
                </select>

                {showTrackingInput && (
                  <div className="mt-3">
                    <p className="font-bold text-[13px] mb-2">Tracking No. <span className="text-red-500">*</span></p>
                    <input type="text" value={trackingInput} onChange={(e) => { setTrackingInput(e.target.value); setTrackingError(""); }}
                      placeholder="Enter FedEx tracking number"
                      className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] w-full outline-none focus:border-[#511E0B]" />
                    {trackingError && <p className="text-red-500 text-[12px] mt-1">{trackingError}</p>}
                  </div>
                )}

                {showCancelReason && (
                  <div className="mt-3">
                    <p className="font-bold text-[13px] mb-2">Cancellation Reason <span className="text-red-500">*</span></p>
                    <textarea value={cancelReason} onChange={(e) => { setCancelReason(e.target.value); setCancelReasonError(""); }}
                      placeholder="Write the reason for cancelling this order..." rows={3}
                      className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] w-full outline-none focus:border-[#511E0B] resize-none" />
                    {cancelReasonError && <p className="text-red-500 text-[12px] mt-1">{cancelReasonError}</p>}
                  </div>
                )}

                {saveError && <p className="text-red-500 text-[12px] mt-2">{saveError}</p>}

                <button type="button" onClick={handleSave} disabled={saving || newStatus === selectedOrder.status}
                  className="w-full mt-3 bg-[#511E0B] text-white rounded py-3 font-bold text-[14px] hover:bg-[#3d1608] transition-colors cursor-pointer border-none disabled:opacity-50">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
