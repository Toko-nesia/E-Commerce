"use client";

import { Package, ShoppingBag, Tag, TrendingUp, Clock } from "lucide-react";
import { products } from "@/data/products";
import { categories } from "@/data/categories";

const recentOrders = [
  { id: "#ZB-0001", customer: "Haruka Yamamoto", product: "Cosmos Kipas Angin Wall Fan", total: "Rp 795.400", status: "BARU", date: "12 Okt 2026" },
  { id: "#ZB-0002", customer: "Keiko Tanaka", product: "Atasan Batik Tenun Emma Black", total: "Rp 131.822", status: "DIPROSES", date: "11 Okt 2026" },
  { id: "#ZB-0003", customer: "Ryo Matsumoto", product: "Cengkeh Utuh Rempah Organik", total: "Rp 68.400", status: "DIKIRIM", date: "09 Okt 2026" },
  { id: "#ZB-0004", customer: "Aiko Nakamura", product: "Cosmos Kipas Angin Wall Fan", total: "Rp 397.700", status: "SELESAI", date: "05 Okt 2026" },
  { id: "#ZB-0005", customer: "Hiroshi Sato", product: "Atasan Batik Tenun Emma Black", total: "Rp 263.644", status: "DIBATALKAN", date: "01 Okt 2026" },
];

const STATUS_STYLES: Record<string, string> = {
  BARU: "bg-[#FFF3CD] text-[#FBBE48]",
  DIPROSES: "bg-orange-50 text-orange-500",
  DIKIRIM: "bg-blue-50 text-blue-500",
  SELESAI: "bg-green-50 text-[#15A15B]",
  DIBATALKAN: "bg-red-50 text-[#DF0000]",
};

export default function AdminDashboardPage() {
  const totalProducts = products.length;
  const totalOrders = recentOrders.length;
  const newOrders = recentOrders.filter((o) => o.status === "BARU").length;
  const totalCategories = categories.length;

  const stats = [
    { label: "Total Produk", value: totalProducts, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Total Pesanan", value: totalOrders, icon: ShoppingBag, color: "bg-[#faf5ee] text-[#511e0b]" },
    { label: "Pesanan Baru", value: newOrders, icon: TrendingUp, color: "bg-[#FFF3CD] text-[#FBBE48]" },
    { label: "Kategori", value: totalCategories, icon: Tag, color: "bg-green-50 text-[#15a15b]" },
  ];

  return (
    <div>
      <h1 className="font-bold text-[20px] text-black mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-[#EBEBEB] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] text-[#A6A6A6]">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="font-bold text-[28px] text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-[#EBEBEB] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#A6A6A6]" />
            <h2 className="font-bold text-[15px] text-black">Pesanan Terbaru</h2>
          </div>
          <a href="/admin/orders" className="text-[13px] text-[#511E0B] hover:underline">
            Lihat semua →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#fafafa]">
                {["No. Pesanan", "Pelanggan", "Produk", "Total", "Status", "Tanggal"].map((h) => (
                  <th key={h} className="text-left text-[12px] font-medium text-[#A6A6A6] px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-[#EBEBEB] last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#511E0B]">{order.id}</td>
                  <td className="px-4 py-3 text-[13px] text-black whitespace-nowrap">{order.customer}</td>
                  <td className="px-4 py-3 text-[13px] text-black max-w-[180px]">
                    <span className="line-clamp-1">{order.product}</span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-black whitespace-nowrap">{order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#A6A6A6] whitespace-nowrap">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
