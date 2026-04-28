"use client";

import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { validateTrackingNumber } from "@/lib/fedex/service";

interface Order {
  id: string;
  date: string;
  customer: string;
  product: string;
  qty: number;
  total: string;
  status: string;
  tracking_number?: string;
  cancel_reason?: string;
}

const initialOrders: Order[] = [
  {
    id: "#ZB-0001",
    date: "12 Okt 2026",
    customer: "Haruka Yamamoto",
    product: "Cosmos Kipas Angin Wall Fan",
    qty: 2,
    total: "Rp 795.400",
    status: "BARU",
    tracking_number: "",
  },
  {
    id: "#ZB-0002",
    date: "11 Okt 2026",
    customer: "Keiko Tanaka",
    product: "Atasan Batik Tenun Emma Black",
    qty: 1,
    total: "Rp 131.822",
    status: "DIPROSES",
    tracking_number: "",
  },
  {
    id: "#ZB-0003",
    date: "09 Okt 2026",
    customer: "Ryo Matsumoto",
    product: "Cengkeh Utuh Rempah Organik",
    qty: 3,
    total: "Rp 68.400",
    status: "DIKIRIM",
    tracking_number: "7489234651200",
  },
  {
    id: "#ZB-0004",
    date: "05 Okt 2026",
    customer: "Aiko Nakamura",
    product: "Cosmos Kipas Angin Wall Fan",
    qty: 1,
    total: "Rp 397.700",
    status: "SELESAI",
    tracking_number: "7489234651201",
  },
  {
    id: "#ZB-0005",
    date: "01 Okt 2026",
    customer: "Hiroshi Sato",
    product: "Atasan Batik Tenun Emma Black",
    qty: 2,
    total: "Rp 263.644",
    status: "DIBATALKAN",
    tracking_number: "",
  },
];

const STATUS_TABS = [
  { label: "Semua", value: "" },
  { label: "Baru", value: "BARU" },
  { label: "Diproses", value: "DIPROSES" },
  { label: "Dikirim", value: "DIKIRIM" },
  { label: "Selesai", value: "SELESAI" },
  { label: "Dibatalkan", value: "DIBATALKAN" },
];

const STATUS_STYLES: Record<string, string> = {
  BARU: "bg-[#FFF3CD] text-[#FBBE48]",
  DIPROSES: "bg-orange-50 text-orange-500",
  DIKIRIM: "bg-blue-50 text-blue-500",
  SELESAI: "bg-green-50 text-[#15A15B]",
  DIBATALKAN: "bg-red-50 text-[#DF0000]",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
      setTrackingInput(selectedOrder.tracking_number ?? "");
      setTrackingError("");
      setCancelReason("");
      setCancelReasonError("");
    }
  }, [selectedOrder]);

  const filtered = useMemo(() => {
    if (!activeTab) return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [activeTab, orders]);

  const showTrackingInput = newStatus === "DIKIRIM";

  function handleSave() {
    // Validate tracking number when changing to DIKIRIM
    if (showTrackingInput && trackingInput !== "") {
      if (!validateTrackingNumber(trackingInput)) {
        setTrackingError("Nomor resi tidak valid. Minimal 12 karakter alfanumerik.");
        return;
      }
    }

    // Require cancellation reason when changing to DIBATALKAN
    if (newStatus === "DIBATALKAN" && cancelReason.trim() === "") {
      setCancelReasonError("Alasan pembatalan wajib diisi.");
      return;
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== selectedOrder!.id) return o;
        const updatedTracking =
          trackingInput === "" ? o.tracking_number : trackingInput;
        return {
          ...o,
          status: newStatus,
          tracking_number: updatedTracking,
          ...(newStatus === "DIBATALKAN" ? { cancel_reason: cancelReason.trim() } : {}),
        };
      })
    );
    setShowModal(false);
  }

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <h1 className="font-bold text-[20px] text-black mb-6">Pesanan Masuk</h1>

      {/* ── White Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="flex items-center border-b border-[#d0d0d0]">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-3 text-[13px] cursor-pointer bg-transparent border-none transition-colors ${
                  isActive
                    ? "border-b-2 border-[#511E0B] text-[#511E0B] font-bold"
                    : "text-[#6b6b6b] hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#d0d0d0]">
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                No. Pesanan
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                Tanggal
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                Pelanggan
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Produk
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                Qty
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                Total
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Status
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                No. Resi
              </th>
              <th className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center text-[13px] text-[#6b6b6b] py-12"
                >
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#d0d0d0] last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* No. Pesanan */}
                  <td className="px-4 py-4 text-[13px] text-black font-medium whitespace-nowrap">
                    {order.id}
                  </td>

                  {/* Tanggal */}
                  <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">
                    {order.date}
                  </td>

                  {/* Pelanggan */}
                  <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">
                    {order.customer}
                  </td>

                  {/* Produk */}
                  <td className="px-4 py-4 text-[13px] text-black max-w-[200px]">
                    <span className="line-clamp-2">{order.product}</span>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-4 text-[13px] text-black text-center">
                    {order.qty}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-4 text-[13px] text-black font-medium whitespace-nowrap">
                    {order.total}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[12px] font-bold whitespace-nowrap ${
                        STATUS_STYLES[order.status] ??
                        "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  {/* No. Resi */}
                  <td className="px-4 py-4 text-[13px] text-black whitespace-nowrap">
                    {order.tracking_number || "—"}
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="text-[#511E0B] text-[13px] bg-transparent border-none cursor-pointer hover:underline font-medium whitespace-nowrap"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Order Detail Modal ─────────────────────────────────────────── */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-w-[520px] w-full mx-4 bg-white rounded shadow-lg p-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#6b6b6b] hover:text-black transition-colors p-0"
              aria-label="Tutup modal"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <h2 className="font-bold text-[17px] mb-4">Detail Pesanan</h2>

            {/* Info Rows */}
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
              <span className="text-[#6b6b6b]">No. Pesanan</span>
              <span className="text-black font-medium">{selectedOrder.id}</span>

              <span className="text-[#6b6b6b]">Tanggal</span>
              <span className="text-black">{selectedOrder.date}</span>

              <span className="text-[#6b6b6b]">Pelanggan</span>
              <span className="text-black">{selectedOrder.customer}</span>

              <span className="text-[#6b6b6b]">Produk</span>
              <span className="text-black">{selectedOrder.product}</span>

              <span className="text-[#6b6b6b]">Qty</span>
              <span className="text-black">{selectedOrder.qty}</span>

              <span className="text-[#6b6b6b]">Total</span>
              <span className="text-black font-medium">
                {selectedOrder.total}
              </span>
            </div>

            {/* Show cancellation reason if order is already cancelled */}
            {selectedOrder.status === "DIBATALKAN" && selectedOrder.cancel_reason && (
              <div className="mt-3 p-3 bg-red-50 rounded text-[13px]">
                <span className="font-bold text-red-600">Alasan Pembatalan: </span>
                <span className="text-red-700">{selectedOrder.cancel_reason}</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#d0d0d0] my-4" />

            {/* Ubah Status */}
            <p className="font-bold text-[13px] mb-2">Ubah Status</p>
            <select
              value={newStatus}
              onChange={(e) => {
                setNewStatus(e.target.value);
                setTrackingError("");
                setCancelReasonError("");
              }}
              className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] w-full outline-none focus:border-[#511E0B] bg-white cursor-pointer"
            >
              <option value="BARU">BARU</option>
              <option value="DIPROSES">DIPROSES</option>
              <option value="DIKIRIM">DIKIRIM</option>
              <option value="DIBATALKAN">DIBATALKAN</option>
            </select>

            {/* No. Resi Input — only when changing to DIKIRIM */}
            {showTrackingInput && (
              <div className="mt-3">
                <p className="font-bold text-[13px] mb-2">No. Resi FedEx</p>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => {
                    setTrackingInput(e.target.value);
                    setTrackingError("");
                  }}
                  placeholder="Masukkan nomor resi FedEx"
                  className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] w-full outline-none focus:border-[#511E0B]"
                />
                {trackingError && (
                  <p className="text-red-500 text-[12px] mt-1">{trackingError}</p>
                )}
              </div>
            )}

            {/* Cancellation Reason — only when changing to DIBATALKAN */}
            {newStatus === "DIBATALKAN" && (
              <div className="mt-3">
                <p className="font-bold text-[13px] mb-2">Alasan Pembatalan <span className="text-red-500">*</span></p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setCancelReasonError("");
                  }}
                  placeholder="Tuliskan alasan pembatalan pesanan ini..."
                  rows={3}
                  className="border border-[#d0d0d0] rounded px-3 py-2 text-[13px] w-full outline-none focus:border-[#511E0B] resize-none"
                />
                {cancelReasonError && (
                  <p className="text-red-500 text-[12px] mt-1">{cancelReasonError}</p>
                )}
              </div>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full mt-3 bg-[#511E0B] text-white rounded py-3 font-bold text-[14px] hover:bg-[#3d1608] transition-colors cursor-pointer border-none"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
