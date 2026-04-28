"use client";

import { useState, useRef } from "react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { User, MapPin, FileText, LogOut, Phone, Plus, MoreVertical, Eye, Edit3, X, Camera } from "lucide-react";
import { savedAddresses } from "@/data/addresses";
import { orderHistory } from "@/data/orders";
import { useAuth } from "@/contexts/auth-context";

type Tab = "profile" | "orders" | "addresses";

const STATUS_LABEL: Record<string, string> = {
  SHIPPED: "Dikirim",
  DELIVERED: "Terkirim",
  PROCESSING: "Diproses",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  SHIPPED: "bg-blue-50 text-blue-500",
  DELIVERED: "bg-green-50 text-[#15a15b]",
  PROCESSING: "bg-orange-50 text-orange-500",
  CANCELLED: "bg-red-50 text-[#df0000]",
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [fullName, setFullName] = useState(user?.full_name ?? "Febri");
  const [email, setEmail] = useState(user?.email ?? "Febri@gmail.com");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "081140755");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<typeof orderHistory[0] | null>(null);

  // Address dropdown
  const [openAddressMenu, setOpenAddressMenu] = useState<string | null>(null);

  const sidebarItems = [
    { icon: User, label: "Profil Saya", id: "profile" as Tab },
    { icon: FileText, label: "Riwayat Pesanan", id: "orders" as Tab },
    { icon: MapPin, label: "Alamat Tersimpan", id: "addresses" as Tab },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <PageWrapper>
      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-[200px] shrink-0">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="rounded-full w-[88px] h-[88px] overflow-hidden border-4 border-white shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  src={avatarPreview ?? "/images/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png"}
                />
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#511e0b] rounded-full w-7 h-7 flex items-center justify-center cursor-pointer border-2 border-white"
                aria-label="Ganti foto"
              >
                <Camera size={12} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </div>
            <p className="font-bold text-[16px] text-black mt-3">{fullName}</p>
            <p className="text-[13px] text-[#a6a6a6]">{email}</p>
          </div>

          {/* Tab nav — horizontal on mobile, vertical on desktop */}
          <nav className="mt-6 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-none cursor-pointer text-left text-[13px] tracking-tight transition-colors ${
                  activeTab === item.id
                    ? "bg-[#511e0b] text-white font-bold"
                    : "bg-transparent text-black hover:bg-[#f5f0ea]"
                }`}
              >
                <item.icon size={15} className="shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => logout()}
              className="shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-none cursor-pointer text-left text-[13px] text-[#df0000] bg-transparent hover:bg-red-50 md:mt-4"
            >
              <LogOut size={15} className="shrink-0" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* ── Profile Info ── */}
          {activeTab === "profile" && (
            <section>
              <h2 className="font-bold text-[22px] text-black mb-6">Profil Saya</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] text-[#a6a6a6] tracking-widest uppercase mb-1.5">Nama Lengkap</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-[#d9d9d9] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a6a6a6] tracking-widest uppercase mb-1.5">Alamat Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#d9d9d9] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a6a6a6] tracking-widest uppercase mb-1.5">Nomor Telepon</label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border border-[#d9d9d9] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-[#511e0b] text-white rounded-lg px-6 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
                  Simpan Perubahan
                </button>
              </div>
            </section>
          )}

          {/* ── Order History ── */}
          {activeTab === "orders" && (
            <section>
              <h2 className="font-bold text-[22px] text-black mb-6">Riwayat Pesanan</h2>
              <div className="border border-[#d9d9d9] rounded-xl overflow-hidden">
                <div className="grid grid-cols-5 bg-[#f5f5f5] px-5 py-3">
                  {["ID PESANAN", "TANGGAL", "STATUS", "TOTAL", "AKSI"].map((h) => (
                    <span key={h} className="font-bold text-[11px] text-[#a6a6a6] tracking-wider">{h}</span>
                  ))}
                </div>
                {orderHistory.map((order) => (
                  <div key={order.id} className="grid grid-cols-5 px-5 py-4 border-t border-[#ececec] items-center hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-[13px] text-[#511e0b]">{order.id}</span>
                    <span className="text-[13px] text-black">{order.date}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold w-fit ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-[13px] text-black">{order.total_price}</span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-transparent border-none cursor-pointer p-0 w-fit hover:text-[#511e0b] transition-colors text-[#a6a6a6]"
                      aria-label="Lihat detail"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                ))}
                {orderHistory.length === 0 && (
                  <div className="px-5 py-12 text-center text-[13px] text-[#a6a6a6]">Belum ada pesanan.</div>
                )}
              </div>
            </section>
          )}

          {/* ── Saved Addresses ── */}
          {activeTab === "addresses" && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-[22px] text-black">Alamat Tersimpan</h2>
                <button className="flex items-center gap-1.5 text-[13px] text-[#511e0b] font-medium bg-transparent border border-[#511e0b] rounded-lg px-3 py-2 cursor-pointer hover:bg-[#faf5ee] transition-colors">
                  <Plus size={14} />
                  Tambah Alamat
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div key={addr.id} className="border border-[#d9d9d9] rounded-xl p-5 relative">
                    <div className="flex items-center gap-2 mb-3 pr-8">
                      <span className="bg-[#511e0b] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{addr.label}</span>
                    </div>
                    <p className="font-medium text-[15px] text-black">{addr.name}</p>
                    <p className="text-[13px] text-[#a6a6a6] mt-0.5 leading-relaxed">{addr.address}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Phone size={11} className="text-[#a6a6a6]" />
                      <span className="text-[12px] text-[#a6a6a6]">{addr.phone}</span>
                    </div>

                    {/* MoreVertical menu */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setOpenAddressMenu(openAddressMenu === addr.id ? null : addr.id)}
                        className="text-[#a6a6a6] hover:text-black transition-colors bg-transparent border-none cursor-pointer p-0"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openAddressMenu === addr.id && (
                        <div className="absolute right-0 top-6 bg-white border border-[#ececec] rounded-lg shadow-lg z-10 min-w-[120px] overflow-hidden">
                          <button className="w-full text-left px-4 py-2.5 text-[13px] text-black hover:bg-[#f5f0ea] flex items-center gap-2 bg-transparent border-none cursor-pointer">
                            <Edit3 size={13} />
                            Edit
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-[13px] text-[#df0000] hover:bg-red-50 flex items-center gap-2 bg-transparent border-none cursor-pointer">
                            <X size={13} />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[18px] text-black">Detail Pesanan</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-[#a6a6a6] hover:text-black bg-transparent border-none cursor-pointer p-0">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ["ID Pesanan", selectedOrder.id],
                ["Tanggal", selectedOrder.date],
                ["Status", STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status],
                ["Total", selectedOrder.total_price],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-[14px]">
                  <span className="text-[#a6a6a6]">{label}</span>
                  <span className="font-medium text-black">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 bg-[#511e0b] text-white rounded-lg py-3 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
