"use client";

import { useState, useRef } from "react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { User, MapPin, FileText, LogOut, Phone, Plus, MoreVertical, Eye, Edit3, X, Camera } from "lucide-react";
import { savedAddresses } from "@/data/addresses";
import { orderHistory } from "@/data/orders";
import { useAuth } from "@/contexts/auth-context";
import { TrackingModal } from "../components/modals/TrackingModal";

type Tab = "profile" | "orders" | "addresses";

const STATUS_LABEL: Record<string, string> = {
  BARU: "New",
  DIPROSES: "Processing",
  DIKIRIM: "Shipped",
  SELESAI: "Completed",
  DIBATALKAN: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  BARU: "bg-[#FFF3CD] text-[#FBBE48]",
  DIPROSES: "bg-orange-50 text-orange-500",
  DIKIRIM: "bg-blue-50 text-blue-500",
  SELESAI: "bg-green-50 text-[#15a15b]",
  DIBATALKAN: "bg-red-50 text-[#df0000]",
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

  // Tracking modal
  const [trackingOrder, setTrackingOrder] = useState<typeof orderHistory[0] | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Refund modal
  const [refundOrder, setRefundOrder] = useState<typeof orderHistory[0] | null>(null);
  const [refundMethod, setRefundMethod] = useState<"bank_transfer" | "ewallet">("bank_transfer");
  const [refundAccount, setRefundAccount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitted, setRefundSubmitted] = useState(false);

  // Address dropdown
  const [openAddressMenu, setOpenAddressMenu] = useState<string | null>(null);

  const sidebarItems = [
    { icon: User, label: "My Profile", id: "profile" as Tab },
    { icon: FileText, label: "Order History", id: "orders" as Tab },
    { icon: MapPin, label: "Saved Addresses", id: "addresses" as Tab },
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
                aria-label="Change photo"
              >
                <Camera size={12} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </div>
            <p className="font-bold text-[17px] text-black mt-3">{fullName}</p>
            <p className="text-[13px] text-[#6b6b6b]">{email}</p>
          </div>

          {/* Tab nav — horizontal on mobile, vertical on desktop */}
          <nav className="mt-6 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-none cursor-pointer text-left text-[14px] tracking-tight transition-colors ${
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
              className="shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-none cursor-pointer text-left text-[14px] text-[#df0000] bg-transparent hover:bg-red-50 md:mt-4"
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
              <h2 className="font-bold text-[24px] text-black mb-6">My Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] text-[#6b6b6b] tracking-widest uppercase mb-1.5">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-[#b0b0b0] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b6b6b] tracking-widest uppercase mb-1.5">Email Address</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#b0b0b0] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b6b6b] tracking-widest uppercase mb-1.5">Phone Number</label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border border-[#b0b0b0] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b] transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-[#511e0b] text-white rounded-lg px-6 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
                  Save Changes
                </button>
              </div>
            </section>
          )}

          {/* ── Order History ── */}
          {activeTab === "orders" && (
            <section>
              <h2 className="font-bold text-[24px] text-black mb-6">Order History</h2>
              <div className="border border-[#b0b0b0] rounded-xl overflow-hidden">
                <div className="grid grid-cols-6 bg-[#f5f5f5] px-5 py-3">
                  {["ORDER ID", "DATE", "STATUS", "TRACKING", "TOTAL", "ACTION"].map((h) => (
                    <span key={h} className="font-bold text-[11px] text-[#6b6b6b] tracking-wider">{h}</span>
                  ))}
                </div>
                {orderHistory.map((order) => (
                  <div key={order.id} className="grid grid-cols-6 px-5 py-4 border-t border-[#d5d5d5] items-center hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-[13px] text-[#511e0b]">{order.id}</span>
                    <span className="text-[13px] text-black">{order.date}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-bold w-fit ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {order.status === "DIKIRIM" && <span className="text-blue-500 text-[10px]">●</span>}
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-[13px]">
                      {order.tracking_number ? (
                        <button
                          onClick={() => { setTrackingOrder(order); setShowTrackingModal(true); }}
                          className="bg-transparent border border-[#511e0b] text-[#511e0b] rounded px-2 py-1 text-[11px] font-medium cursor-pointer hover:bg-[#faf5ee] transition-colors"
                        >
                          Track Package
                        </button>
                      ) : (
                        <span className="text-[#9b9b9b]">Awaiting shipment</span>
                      )}
                    </span>
                    <span className="text-[13px] text-black">{order.total_price}</span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-transparent border-none cursor-pointer p-0 w-fit hover:text-[#511e0b] transition-colors text-[#6b6b6b]"
                      aria-label="View details"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                ))}
                {orderHistory.length === 0 && (
                  <div className="px-5 py-12 text-center text-[13px] text-[#6b6b6b]">No orders yet.</div>
                )}
              </div>
            </section>
          )}

          {/* ── Saved Addresses ── */}
          {activeTab === "addresses" && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-[24px] text-black">Saved Addresses</h2>
                <button className="flex items-center gap-1.5 text-[13px] text-[#511e0b] font-medium bg-transparent border border-[#511e0b] rounded-lg px-3 py-2 cursor-pointer hover:bg-[#faf5ee] transition-colors">
                  <Plus size={14} />
                  Add Address
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div key={addr.id} className="border border-[#b0b0b0] rounded-xl p-5 relative">
                    <div className="flex items-center gap-2 mb-3 pr-8">
                      <span className="bg-[#511e0b] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{addr.label}</span>
                    </div>
                    <p className="font-medium text-[15px] text-black">{addr.name}</p>
                    <p className="text-[13px] text-[#6b6b6b] mt-0.5 leading-relaxed">{addr.address}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Phone size={11} className="text-[#6b6b6b]" />
                      <span className="text-[13px] text-[#6b6b6b]">{addr.phone}</span>
                    </div>

                    {/* MoreVertical menu */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setOpenAddressMenu(openAddressMenu === addr.id ? null : addr.id)}
                        className="text-[#6b6b6b] hover:text-black transition-colors bg-transparent border-none cursor-pointer p-0"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openAddressMenu === addr.id && (
                        <div className="absolute right-0 top-6 bg-white border border-[#d5d5d5] rounded-lg shadow-lg z-10 min-w-[120px] overflow-hidden">
                          <button className="w-full text-left px-4 py-2.5 text-[13px] text-black hover:bg-[#f5f0ea] flex items-center gap-2 bg-transparent border-none cursor-pointer">
                            <Edit3 size={13} />
                            Edit
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-[13px] text-[#df0000] hover:bg-red-50 flex items-center gap-2 bg-transparent border-none cursor-pointer">
                            <X size={13} />
                            Delete
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
              <h3 className="font-bold text-[18px] text-black">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-[#6b6b6b] hover:text-black bg-transparent border-none cursor-pointer p-0">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ["Order ID", selectedOrder.id],
                ["Date", selectedOrder.date],
                ["Status", STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status],
                ["Total", selectedOrder.total_price],
                ...(selectedOrder.tracking_number ? [["Tracking No.", selectedOrder.tracking_number]] : []),
                ...(selectedOrder.estimated_delivery ? [["Est. Delivery", selectedOrder.estimated_delivery]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-[14px]">
                  <span className="text-[#6b6b6b]">{label}</span>
                  <span className="font-medium text-black">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 bg-[#511e0b] text-white rounded-lg py-3 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors"
            >
              Close
            </button>
            {selectedOrder.status === "DIBATALKAN" && (
              <button
                onClick={() => {
                  setRefundOrder(selectedOrder);
                  setRefundSubmitted(false);
                  setRefundAccount("");
                  setRefundReason("");
                  setRefundMethod("bank_transfer");
                  setSelectedOrder(null);
                }}
                className="w-full mt-2 border border-[#df0000] text-[#df0000] rounded-lg py-3 font-bold text-[14px] border-solid cursor-pointer hover:bg-red-50 transition-colors bg-transparent"
              >
                Request Refund
              </button>
            )}
          </div>
        </div>
      )}
      {/* Tracking Modal */}
      {trackingOrder && (
        <TrackingModal
          isOpen={showTrackingModal}
          onClose={() => { setShowTrackingModal(false); setTrackingOrder(null); }}
          order={trackingOrder}
        />
      )}

      {/* Refund Modal */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setRefundOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[460px] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[18px] text-black">Refund Request</h3>
              <button onClick={() => setRefundOrder(null)} className="text-[#6b6b6b] hover:text-black bg-transparent border-none cursor-pointer p-0">
                <X size={20} />
              </button>
            </div>

            {refundSubmitted ? (
              <div className="text-center py-4">
                <div className="text-[40px] mb-3">✅</div>
                <p className="font-bold text-[16px] text-black mb-2">Request Submitted</p>
                <p className="text-[13px] text-[#6b6b6b]">Our team will process your refund within 3–5 business days.</p>
                <button
                  onClick={() => setRefundOrder(null)}
                  className="mt-6 w-full bg-[#511e0b] text-white rounded-lg py-3 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-[#6b6b6b] mb-4">
                  Order <span className="font-medium text-black">{refundOrder.id}</span> has been cancelled.
                  Fill in the form below to request a refund.
                </p>

                <div className="space-y-4">
                  {/* Reason */}
                  <div>
                    <label className="block text-[12px] font-bold text-black mb-1.5">Reason for Refund</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explain the reason for your refund request..."
                      rows={3}
                      className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b] resize-none"
                    />
                  </div>

                  {/* Refund method */}
                  <div>
                    <label className="block text-[12px] font-bold text-black mb-1.5">Refund Method</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRefundMethod("bank_transfer")}
                        className={`flex-1 py-2 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${refundMethod === "bank_transfer" ? "bg-[#511e0b] text-white border-[#511e0b]" : "bg-white text-black border-[#b0b0b0] hover:border-[#511e0b]"}`}
                      >
                        Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundMethod("ewallet")}
                        className={`flex-1 py-2 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${refundMethod === "ewallet" ? "bg-[#511e0b] text-white border-[#511e0b]" : "bg-white text-black border-[#b0b0b0] hover:border-[#511e0b]"}`}
                      >
                        E-Wallet
                      </button>
                    </div>
                  </div>

                  {/* Account number */}
                  <div>
                    <label className="block text-[12px] font-bold text-black mb-1.5">
                      {refundMethod === "bank_transfer" ? "Account Number (BCA/Mandiri/BNI)" : "E-Wallet Number (GoPay/OVO/Dana)"}
                    </label>
                    <input
                      type="text"
                      value={refundAccount}
                      onChange={(e) => setRefundAccount(e.target.value)}
                      placeholder={refundMethod === "bank_transfer" ? "e.g. 1234567890" : "e.g. 08123456789"}
                      className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!refundReason.trim() || !refundAccount.trim()) return;
                    setRefundSubmitted(true);
                  }}
                  disabled={!refundReason.trim() || !refundAccount.trim()}
                  className="w-full mt-6 bg-[#511e0b] text-white rounded-lg py-3 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
