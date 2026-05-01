"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { User, MapPin, FileText, LogOut, Phone, Plus, MoreVertical, Eye, Edit3, X, Camera, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { resolveImagePath } from "@/lib/image-paths";
import type { Address, Order } from "@/types/database";
import Link from "next/link";

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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile loading/saving state
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [openAddressMenu, setOpenAddressMenu] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Address form fields
  const [addrLabel, setAddrLabel] = useState("");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [addrCountryCode, setAddrCountryCode] = useState("JP");

  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const supabase = createClient();

  // Load profile data from Supabase on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email, phone, avatar_url")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setPhoneNumber(data.phone || "");
          if (data.avatar_url) {
            setAvatarPreview(data.avatar_url);
          }
        }
      } catch {
        // Fallback to auth context data
        setFullName(user.full_name || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phone || "");
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user?.id, supabase, user?.full_name, user?.email, user?.phone]);

  // Save profile changes to Supabase
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      let avatarUrl: string | undefined;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const filePath = `${user.id}/avatar.png`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      // Update profile in database
      const updatePayload: { full_name: string; phone: string; avatar_url?: string } = {
        full_name: fullName.trim(),
        phone: phoneNumber.trim(),
      };
      if (avatarUrl) {
        updatePayload.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);
      if (error) throw error;

      setProfileMessage({ type: "success", text: "Profile updated successfully!" });
      setAvatarFile(null);
    } catch {
      setProfileMessage({ type: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  };

  // Fetch addresses from Supabase
  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    setAddressError(null);
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch {
      setAddressError("Failed to load addresses. Please try again.");
    } finally {
      setAddressesLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (activeTab === "addresses" && user?.id) {
      fetchAddresses();
    }
  }, [activeTab, user?.id, fetchAddresses]);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch {
      setOrdersError("Failed to load orders. Please try again.");
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (activeTab === "orders" && user?.id) {
      fetchOrders();
    }
  }, [activeTab, user?.id, fetchOrders]);

  const resetAddressForm = () => {
    setAddrLabel("");
    setAddrName("");
    setAddrPhone("");
    setAddrAddress("");
    setAddrPostalCode("");
    setAddrCountryCode("JP");
    setEditingAddress(null);
  };

  const openCreateForm = () => {
    resetAddressForm();
    setShowAddressForm(true);
  };

  const openEditForm = (addr: Address) => {
    setAddrLabel(addr.label || "");
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrAddress(addr.address);
    setAddrPostalCode(addr.postal_code || "");
    setAddrCountryCode(addr.country_code || "JP");
    setEditingAddress(addr);
    setShowAddressForm(true);
    setOpenAddressMenu(null);
  };

  const handleSaveAddress = async () => {
    if (!user?.id || !addrName.trim() || !addrPhone.trim() || !addrAddress.trim()) return;
    setAddressSaving(true);
    setAddressError(null);
    try {
      const payload = {
        user_id: user.id,
        label: addrLabel.trim() || null,
        name: addrName.trim(),
        phone: addrPhone.trim(),
        address: addrAddress.trim(),
        postal_code: addrPostalCode.trim() || null,
        country_code: addrCountryCode.trim() || "JP",
      };

      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingAddress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert(payload);
        if (error) throw error;
      }

      setShowAddressForm(false);
      resetAddressForm();
      await fetchAddresses();
    } catch {
      setAddressError(editingAddress ? "Failed to update address." : "Failed to create address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setAddressSaving(true);
    setAddressError(null);
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setDeleteConfirmId(null);
      await fetchAddresses();
    } catch {
      setAddressError("Failed to delete address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user?.id) return;
    setAddressSaving(true);
    setAddressError(null);
    setOpenAddressMenu(null);
    try {
      // First, set all user's addresses to non-default
      const { error: clearError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      if (clearError) throw clearError;

      // Then set the selected one as default
      const { error: setError } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);
      if (setError) throw setError;

      await fetchAddresses();
    } catch {
      setAddressError("Failed to set default address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const sidebarItems = [
    { icon: User, label: "My Profile", id: "profile" as Tab },
    { icon: FileText, label: "Order History", id: "orders" as Tab },
    { icon: MapPin, label: "Saved Addresses", id: "addresses" as Tab },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
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
                  src={avatarPreview ?? resolveImagePath("/images/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png")}
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
              onClick={() => setShowLogoutModal(true)}
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

              {profileMessage && (
                <div className={`mb-4 p-3 rounded-lg text-[13px] ${profileMessage.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-[#df0000]"}`}>
                  {profileMessage.text}
                </div>
              )}

              {profileLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#511e0b]" />
                  <span className="ml-2 text-[14px] text-[#6b6b6b]">Loading profile...</span>
                </div>
              ) : (
                <>
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
                        disabled
                        className="w-full border border-[#b0b0b0] rounded-lg px-4 py-3 text-[14px] text-black outline-none bg-gray-50 cursor-not-allowed"
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
                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="bg-[#511e0b] text-white rounded-lg px-6 py-2.5 text-[14px] font-bold border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {profileSaving && <Loader2 size={16} className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── Order History ── */}
          {activeTab === "orders" && (
            <section>
              <h2 className="font-bold text-[24px] text-black mb-6">Order History</h2>

              {ordersError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-[#df0000]">
                  {ordersError}
                  <button onClick={fetchOrders} className="ml-2 underline font-medium bg-transparent border-none cursor-pointer text-[#df0000]">Retry</button>
                </div>
              )}

              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#511e0b]" />
                  <span className="ml-2 text-[14px] text-[#6b6b6b]">Loading orders...</span>
                </div>
              ) : (
                <div className="border border-[#b0b0b0] rounded-xl overflow-hidden">
                  <div className="grid grid-cols-5 bg-[#f5f5f5] px-5 py-3">
                    {["ORDER ID", "DATE", "STATUS", "TOTAL", "ACTION"].map((h) => (
                      <span key={h} className="font-bold text-[11px] text-[#6b6b6b] tracking-wider">{h}</span>
                    ))}
                  </div>
                  {orders.map((order) => {
                    const displayId = order.midtrans_order_id
                      ? `#${order.midtrans_order_id}`
                      : `#${order.id.slice(0, 8).toUpperCase()}`;
                    const displayDate = order.created_at
                      ? new Date(order.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                      : "—";
                    return (
                      <div key={order.id} className="grid grid-cols-5 px-5 py-4 border-t border-[#d5d5d5] items-center hover:bg-gray-50 transition-colors">
                        <span className="font-bold text-[13px] text-[#511e0b]">{displayId}</span>
                        <span className="text-[13px] text-black">{displayDate}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-bold w-fit ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {order.status === "DIKIRIM" && <span className="text-blue-500 text-[10px]">●</span>}
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                        <span className="text-[13px] text-black">{order.total_price}</span>
                        <Link
                          href={`/profile/orders/${order.id}`}
                          className="bg-transparent border-none cursor-pointer p-0 w-fit hover:text-[#511e0b] transition-colors text-[#6b6b6b]"
                          aria-label="View details"
                        >
                          <Eye size={18} />
                        </Link>
                      </div>
                    );
                  })}
                  {orders.length === 0 && (
                    <div className="px-5 py-12 text-center text-[13px] text-[#6b6b6b]">No orders yet.</div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Saved Addresses ── */}
          {activeTab === "addresses" && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-[24px] text-black">Saved Addresses</h2>
                <button
                  onClick={openCreateForm}
                  className="flex items-center gap-1.5 text-[13px] text-[#511e0b] font-medium bg-transparent border border-[#511e0b] rounded-lg px-3 py-2 cursor-pointer hover:bg-[#faf5ee] transition-colors"
                >
                  <Plus size={14} />
                  Add Address
                </button>
              </div>

              {addressError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-[#df0000]">
                  {addressError}
                  <button onClick={fetchAddresses} className="ml-2 underline font-medium bg-transparent border-none cursor-pointer text-[#df0000]">Retry</button>
                </div>
              )}

              {addressesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#511e0b]" />
                  <span className="ml-2 text-[14px] text-[#6b6b6b]">Loading addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[#6b6b6b]">No saved addresses yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`border rounded-xl p-5 relative ${addr.is_default ? "border-[#511e0b]" : "border-[#b0b0b0]"}`}>
                      <div className="flex items-center gap-2 mb-3 pr-8">
                        {addr.label && (
                          <span className="bg-[#511e0b] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{addr.label}</span>
                        )}
                        {addr.is_default && (
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">DEFAULT</span>
                        )}
                      </div>
                      <p className="font-medium text-[15px] text-black">{addr.name}</p>
                      <p className="text-[13px] text-[#6b6b6b] mt-0.5 leading-relaxed">{addr.address}</p>
                      {addr.postal_code && (
                        <p className="text-[12px] text-[#6b6b6b] mt-0.5">{addr.postal_code}, {addr.country_code || "JP"}</p>
                      )}
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
                          <div className="absolute right-0 top-6 bg-white border border-[#d5d5d5] rounded-lg shadow-lg z-10 min-w-[140px] overflow-hidden">
                            {!addr.is_default && (
                              <button
                                onClick={() => handleSetDefault(addr.id)}
                                className="w-full text-left px-4 py-2.5 text-[13px] text-black hover:bg-[#f5f0ea] flex items-center gap-2 bg-transparent border-none cursor-pointer"
                              >
                                <Star size={13} />
                                Set as Default
                              </button>
                            )}
                            <button
                              onClick={() => openEditForm(addr)}
                              className="w-full text-left px-4 py-2.5 text-[13px] text-black hover:bg-[#f5f0ea] flex items-center gap-2 bg-transparent border-none cursor-pointer"
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => { setDeleteConfirmId(addr.id); setOpenAddressMenu(null); }}
                              className="w-full text-left px-4 py-2.5 text-[13px] text-[#df0000] hover:bg-red-50 flex items-center gap-2 bg-transparent border-none cursor-pointer"
                            >
                              <X size={13} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-black">Logout Confirmation</h3>
              <button onClick={() => setShowLogoutModal(false)} className="text-[#6b6b6b] hover:text-black bg-transparent border-none cursor-pointer p-0">
                <X size={20} />
              </button>
            </div>
            <p className="text-[14px] text-[#6b6b6b] mb-6">Are you sure you want to log out from your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-bold border border-[#b0b0b0] bg-white text-black cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-bold border-none bg-[#df0000] text-white cursor-pointer hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => { setShowAddressForm(false); resetAddressForm(); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[460px] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[18px] text-black">{editingAddress ? "Edit Address" : "Add New Address"}</h3>
              <button onClick={() => { setShowAddressForm(false); resetAddressForm(); }} className="text-[#6b6b6b] hover:text-black bg-transparent border-none cursor-pointer p-0">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Label (optional)</label>
                <input
                  type="text"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="e.g. HOME, OFFICE"
                  className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Recipient Name *</label>
                <input
                  type="text"
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Phone *</label>
                <input
                  type="text"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="e.g. +81 90-1234-5678"
                  className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Address *</label>
                <textarea
                  value={addrAddress}
                  onChange={(e) => setAddrAddress(e.target.value)}
                  placeholder="Full street address"
                  rows={2}
                  className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-black mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={addrPostalCode}
                    onChange={(e) => setAddrPostalCode(e.target.value)}
                    placeholder="e.g. 107-8420"
                    className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-black mb-1.5">Country Code</label>
                  <input
                    type="text"
                    value={addrCountryCode}
                    onChange={(e) => setAddrCountryCode(e.target.value)}
                    placeholder="JP"
                    className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAddress}
              disabled={addressSaving || !addrName.trim() || !addrPhone.trim() || !addrAddress.trim()}
              className="w-full mt-6 bg-[#511e0b] text-white rounded-lg py-3 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addressSaving && <Loader2 size={16} className="animate-spin" />}
              {editingAddress ? "Update Address" : "Save Address"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[16px] text-black mb-2">Delete Address?</p>
            <p className="text-[13px] text-[#6b6b6b] mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border border-[#b0b0b0] bg-white text-black cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAddress(deleteConfirmId)}
                disabled={addressSaving}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border-none bg-[#df0000] text-white cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addressSaving && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
