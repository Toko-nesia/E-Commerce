"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, Tag, TrendingUp, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  total: string;
  status: string;
  date: string;
}

const STATUS_STYLES: Record<string, string> = {
  BARU: "bg-[#FFF3CD] text-[#FBBE48]",
  DIPROSES: "bg-orange-50 text-orange-500",
  DIKIRIM: "bg-blue-50 text-blue-500",
  SELESAI: "bg-green-50 text-[#15A15B]",
  DIBATALKAN: "bg-red-50 text-[#DF0000]",
};

export default function AdminDashboardPage() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [newOrders, setNewOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      setLoading(true);
      const [prodRes, catRes, totalOrdersRes, newOrdersRes, recentRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "BARU"),
        supabase
          .from("orders")
          .select("id, status, total_price, created_at, midtrans_order_id, user_id, profiles(full_name), order_items(product_id, products(name))")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (prodRes.count != null) setTotalProducts(prodRes.count);
      if (catRes.count != null) setTotalCategories(catRes.count);
      if (totalOrdersRes.count != null) setTotalOrders(totalOrdersRes.count);
      if (newOrdersRes.count != null) setNewOrders(newOrdersRes.count);

      if (recentRes.data) {
        const rows: RecentOrder[] = recentRes.data.map((o) => {
          const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
          const firstItem = Array.isArray(o.order_items) ? o.order_items[0] : null;
          const product = firstItem
            ? (Array.isArray(firstItem.products) ? firstItem.products[0] : firstItem.products)
            : null;

          return {
            id: o.midtrans_order_id ?? `#${o.id.slice(0, 8).toUpperCase()}`,
            customer: (profile as { full_name?: string } | null)?.full_name ?? "Unknown",
            product: (product as { name?: string } | null)?.name ?? "—",
            total: o.total_price ?? "—",
            status: o.status,
            date: new Date(o.created_at).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          };
        });
        setRecentOrders(rows);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "bg-[#FDF9F5] text-[#511e0b]" },
    { label: "New Orders", value: newOrders, icon: TrendingUp, color: "bg-[#FFF3CD] text-[#FBBE48]" },
    { label: "Categories", value: totalCategories, icon: Tag, color: "bg-green-50 text-[#15a15b]" },
  ];

  return (
    <div>
      <h1 className="font-bold text-[20px] text-black mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] text-[#6b6b6b]">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="font-bold text-[22px] text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-[#d0d0d0] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d0d0d0]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#6b6b6b]" />
            <h2 className="font-bold text-[15px] text-black">Recent Orders</h2>
          </div>
          <a href="/admin/orders" className="text-[13px] text-[#511E0B] hover:underline">
            Lihat semua →
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-[#511e0b]" />
            <span className="ml-2 text-[14px] text-[#6b6b6b]">Loading...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#d0d0d0] bg-[#fafafa]">
                  {["Order No.", "Customer", "Product", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left text-[13px] font-medium text-[#6b6b6b] px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-[13px] text-[#6b6b6b] py-12">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#d0d0d0] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-medium text-[#511E0B]">{order.id}</td>
                      <td className="px-4 py-3 text-[13px] text-black whitespace-nowrap">{order.customer}</td>
                      <td className="px-4 py-3 text-[13px] text-black max-w-[180px]">
                        <span className="line-clamp-1">{order.product}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-black whitespace-nowrap">{order.total}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-bold ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6b6b6b] whitespace-nowrap">{order.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
