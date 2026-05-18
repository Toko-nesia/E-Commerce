"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { REFUND_STATUS_LABEL, type RefundStatus } from "@/domain/order-status";

interface RefundRow {
  id: string;
  order_id: string;
  user_id: string;
  refund_method: string;
  account_number: string;
  account_name?: string | null;
  payout_provider?: string | null;
  reason: string;
  status: RefundStatus;
  admin_note?: string | null;
  refund_amount?: number | null;
  initiated_by?: "buyer" | "seller" | null;
  rejection_reason?: string | null;
  transfer_note?: string | null;
  created_at?: string;
  orders: { id: string; total_price: string } | null;
  profiles: { full_name: string; email: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  awaiting_seller_review: "bg-yellow-50 text-yellow-700",
  cancelled_by_buyer: "bg-gray-100 text-gray-700",
  awaiting_buyer_payout: "bg-purple-50 text-purple-700",
  awaiting_manual_transfer: "bg-blue-50 text-blue-700",
  refunded: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-[#df0000]",
};

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionRow, setActionRow] = useState<RefundRow | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "refunded" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/refunds", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to load refund requests.");
      setRefunds((data.refunds as RefundRow[]) ?? []);
    } catch (err) {
      const detail = err instanceof Error ? err.message : null;
      setError(detail && detail !== "Failed to load refund requests."
        ? `Failed to load refund requests. ${detail}`
        : "Failed to load refund requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const openAction = (row: RefundRow, type: "approve" | "reject" | "refunded") => {
    setActionRow(row);
    setActionType(type);
    setAdminNote("");
    setActionError(null);
  };

  const handleAction = async () => {
    if (!actionRow || !actionType) return;
    if (actionType === "reject" && !adminNote.trim()) {
      setActionError("Rejection reason is required.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const endpoint = actionType === "refunded"
        ? `/api/admin/refunds/${actionRow.id}/mark-refunded`
        : `/api/admin/refunds/${actionRow.id}/review`;
      const payload = actionType === "refunded"
        ? { transferNote: adminNote.trim() }
        : actionType === "approve"
          ? { action: "approve", note: adminNote.trim() }
          : { action: "reject", rejectionReason: adminNote.trim() };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update refund request.");
      setActionRow(null);
      setActionType(null);
      await fetchRefunds();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update refund request. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-[22px] text-black">Refund Requests</h1>
        <button
          onClick={fetchRefunds}
          className="text-[13px] text-[#511e0b] border border-[#511e0b] rounded-lg px-3 py-1.5 bg-transparent cursor-pointer hover:bg-[#faf5ee] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-[#df0000]">
          {error}
          <button onClick={fetchRefunds} className="ml-2 underline font-medium bg-transparent border-none cursor-pointer text-[#df0000]">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#511e0b]" />
          <span className="ml-2 text-[14px] text-gray-500">Loading refund requests...</span>
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-16 text-[14px] text-gray-500">No refund requests found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Request ID", "Order ID", "Customer", "Amount", "Method", "Account", "Reason", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-[11px] text-gray-500 tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {refunds.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">{row.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-medium text-[#511e0b] max-w-[180px] break-all">{row.orders?.id ?? row.order_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-black">{row.profiles?.full_name ?? "-"}</p>
                    <p className="text-[11px] text-gray-500">{row.profiles?.email ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.orders?.total_price ?? (row.refund_amount ? `Rp${row.refund_amount.toLocaleString("id-ID")}` : "-")}</td>
                  <td className="px-4 py-3 capitalize whitespace-nowrap">{row.refund_method ? row.refund_method.replace("_", " ") : "Awaiting buyer"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p>{row.account_name || "-"}</p>
                    <p className="text-[11px] text-gray-500">{[row.payout_provider, row.account_number].filter(Boolean).join(" / ") || "Awaiting buyer"}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="truncate" title={row.reason}>{row.reason}</p>
                    {(row.rejection_reason || row.admin_note || row.transfer_note) && (
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate" title={row.rejection_reason || row.admin_note || row.transfer_note || ""}>
                        Note: {row.rejection_reason || row.admin_note || row.transfer_note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLE[row.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {REFUND_STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.status === "awaiting_seller_review" ? (
                      <div className="flex gap-2">
                        <button onClick={() => openAction(row, "approve")} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => openAction(row, "reject")} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-red-50 text-[#df0000] border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    ) : row.status === "awaiting_manual_transfer" ? (
                      <button onClick={() => openAction(row, "refunded")} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                        <CheckCircle size={12} /> Mark done
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionRow && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => { setActionRow(null); setActionType(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[18px] text-black mb-2">
              {actionType === "approve" ? "Approve Refund" : actionType === "reject" ? "Reject Refund" : "Mark Refund Done"}
            </h3>
            <p className="text-[13px] text-gray-500 mb-5">Request ID: <span className="font-medium text-black">{actionRow.id.slice(0, 8)}...</span></p>
            <div className="mb-4">
              <label className="block text-[12px] font-bold text-black mb-1.5">
                {actionType === "reject" ? "Rejection Reason" : actionType === "refunded" ? "Transfer Note" : "Admin Note (optional)"}
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={actionType === "reject" ? "Explain why this cancellation is rejected..." : "Add a note for the customer..."}
                rows={3}
                className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b] resize-none"
              />
            </div>
            {actionError && <p className="mb-3 text-[12px] text-[#df0000]">{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setActionRow(null); setActionType(null); }} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border border-[#b0b0b0] bg-white text-black cursor-pointer hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium border-none text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${actionType === "reject" ? "bg-[#df0000] hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                {actionType === "approve" ? "Approve" : actionType === "reject" ? "Reject" : "Mark Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
