"use client";

import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";

interface Order {
  id: string;
  date: string;
  customer: string;
  product: string;
  qty: number;
  total: string;
  status: string;
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
  },
  {
    id: "#ZB-0002",
    date: "11 Okt 2026",
    customer: "Keiko Tanaka",
    product: "Atasan Batik Tenun Emma Black",
    qty: 1,
    total: "Rp 131.822",
    status: "DIPROSES",
  },
  {
    id: "#ZB-0003",
    date: "09 Okt 2026",
    customer: "Ryo Matsumoto",
    product: "Cengkeh Utuh Rempah Organik",
    qty: 3,
    total: "Rp 68.400",
    status: "DIKIRIM",
  },
  {
    id: "#ZB-0004",
    date: "05 Okt 2026",
    customer: "Aiko Nakamura",
    product: "Cosmos Kipas Angin Wall Fan",
    qty: 1,
    total: "Rp 397.700",
    status: "SELESAI",
  },
  {
    id: "#ZB-0005",
    date: "01 Okt 2026",
    customer: "Hiroshi Sato",
    product: "Atasan Batik Tenun Emma Black",
    qty: 2,
    total: "Rp 263.644",
    status: "DIBATALKAN",
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

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
    }
  }, [selectedOrder]);

  const filtered = useMemo(() => {
    if (!activeTab) return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [activeTab, orders]);

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <h1 className="font-bold text-[20px] text-black mb-6">Pesanan Masuk</h1>

      {/* ── White Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-[2px_2px_10px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="flex items-center border-b border-[#EBEBEB]">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-3 text-[14px] cursor-pointer bg-transparent border-none transition-colors ${
                  isActive
                    ? "border-b-2 border-[#511E0B] text-[#511E0B] font-bold"
                    : "text-[#A6A6A6] hover:text-black"
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
            <tr className="border-b border-[#EBEBEB]">
              <th className="text-left text-[14px] font-normal text-black px-4 py-3 whitespace-nowrap">
                No. Pesanan
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3 whitespace-nowrap">
                Tanggal
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3 whitespace-nowrap">
                Pelanggan
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Produk
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3 whitespace-nowrap">
                Qty
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3 whitespace-nowrap">
                Total
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Status
              </th>
              <th className="text-left text-[14px] font-normal text-black px-4 py-3">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-[13px] text-[#A6A6A6] py-12"
                >
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#EBEBEB] last:border-0 hover:bg-gray-50 transition-colors"
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
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#A6A6A6] hover:text-black transition-colors p-0"
              aria-label="Tutup modal"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <h2 className="font-bold text-[20px] mb-4">Detail Pesanan</h2>

            {/* Info Rows */}
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-[14px]">
              <span className="text-[#A6A6A6]">No. Pesanan</span>
              <span className="text-black font-medium">{selectedOrder.id}</span>

              <span className="text-[#A6A6A6]">Tanggal</span>
              <span className="text-black">{selectedOrder.date}</span>

              <span className="text-[#A6A6A6]">Pelanggan</span>
              <span className="text-black">{selectedOrder.customer}</span>

              <span className="text-[#A6A6A6]">Produk</span>
              <span className="text-black">{selectedOrder.product}</span>

              <span className="text-[#A6A6A6]">Qty</span>
              <span className="text-black">{selectedOrder.qty}</span>

              <span className="text-[#A6A6A6]">Total</span>
              <span className="text-black font-medium">
                {selectedOrder.total}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-[#EBEBEB] my-4" />

            {/* Ubah Status */}
            <p className="font-bold text-[14px] mb-2">Ubah Status</p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="border border-[#EBEBEB] rounded px-3 py-2 text-[14px] w-full outline-none focus:border-[#511E0B] bg-white cursor-pointer"
            >
              <option value="BARU">BARU</option>
              <option value="DIPROSES">DIPROSES</option>
              <option value="DIKIRIM">DIKIRIM</option>
              <option value="SELESAI">SELESAI</option>
              <option value="DIBATALKAN">DIBATALKAN</option>
            </select>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === selectedOrder.id ? { ...o, status: newStatus } : o,
                  ),
                );
                setShowModal(false);
              }}
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
