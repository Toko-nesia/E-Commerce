import { useState } from "react";
import { Link } from "react-router";
import { PageWrapper } from "../layout/PageWrapper";
import { User, MapPin, FileText, LogOut, Phone, Plus, MoreVertical, Eye, Edit3 } from "lucide-react";
import imgAvatar from "../../../imports/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png";

const sidebarItems = [
  { icon: User, label: "Profile Info", id: "profile" },
  { icon: FileText, label: "Order History", id: "orders" },
  { icon: MapPin, label: "Save Addresses", id: "addresses" },
];

const orderHistory = [
  { id: "#XX-0001", date: "Oct 12, 2026", status: "SHIPPED", statusColor: "text-[#fbbe48]", price: "¥ 000,000" },
  { id: "#XX-0002", date: "Sep 28, 2026", status: "DELIVERED", statusColor: "text-[#15a15b]", price: "¥ 00,000" },
  { id: "#XX-0003", date: "Sep 15, 2026", status: "DELIVERED", statusColor: "text-[#15a15b]", price: "¥ 000,000" },
];

const savedAddresses = [
  { id: "1", label: "HOME", name: "Febri", address: "Jl. Tata Surya", phone: "081140" },
  { id: "2", label: "OFFICE", name: "Febrian", address: "Jl. Tata dunia", phone: "081140" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState("Febri");
  const [email, setEmail] = useState("Febri@gmail.com");
  const [phoneNumber, setPhoneNumber] = useState("081140755");

  return (
    <PageWrapper isLoggedIn>
      <div className="max-w-[1200px] mx-auto px-8 py-12 flex gap-8">
        {/* Sidebar */}
        <aside className="w-[200px] shrink-0">
          <div className="flex flex-col items-center">
            <div className="relative rounded-full size-[96px] overflow-hidden border-4 border-white shadow-sm">
              <img alt="Avatar" className="w-full h-full object-cover" src={imgAvatar} />
            </div>
            <div className="absolute ml-16 mt-16">
              <div className="bg-[#511e0b] rounded-full w-[24px] h-[24px] flex items-center justify-center">
                <Edit3 size={12} className="text-white" />
              </div>
            </div>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px] mt-4">Febri</p>
            <p className="font-['Inter',sans-serif] text-[14px] text-[#a6a6a6] tracking-[-0.42px]">febri@gmail.com</p>
          </div>

          <nav className="mt-8 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border-none cursor-pointer text-left font-['Inter',sans-serif] text-[14px] tracking-[-0.42px] transition-colors ${
                  activeTab === item.id ? "bg-[#511e0b] text-white" : "bg-transparent text-black hover:bg-[#f5f0ea]"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border-none cursor-pointer text-left font-['Inter',sans-serif] text-[14px] text-[#df0000] tracking-[-0.42px] bg-transparent hover:bg-red-50 mt-4">
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Profile Info */}
          <section>
            <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-black tracking-[-0.9px]">Profile Info</h2>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <label className="font-['Inter',sans-serif] text-[12px] text-[#a6a6a6] tracking-[1.2px] uppercase">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-2 border border-[#d9d9d9] rounded-[4px] px-4 py-3 font-['Inter',sans-serif] text-[16px] text-black outline-none" />
              </div>
              <div>
                <label className="font-['Inter',sans-serif] text-[12px] text-[#a6a6a6] tracking-[1.2px] uppercase">Email Address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-2 border border-[#d9d9d9] rounded-[4px] px-4 py-3 font-['Inter',sans-serif] text-[16px] text-black outline-none" />
              </div>
              <div>
                <label className="font-['Inter',sans-serif] text-[12px] text-[#a6a6a6] tracking-[1.2px] uppercase">Phone Number</label>
                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full mt-2 border border-[#d9d9d9] rounded-[4px] px-4 py-3 font-['Inter',sans-serif] text-[16px] text-black outline-none" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button className="bg-[#511e0b] text-white rounded-[4px] px-6 py-3 font-['Inter',sans-serif] text-[14px] tracking-[-0.42px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
                Save Changes
              </button>
            </div>
          </section>

          {/* Saved Addresses */}
          <section className="mt-12">
            <div className="flex justify-between items-center">
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-black tracking-[-0.9px]">Saved Addresses</h2>
              <button className="flex items-center gap-1 font-['Inter',sans-serif] text-[14px] text-black tracking-[-0.42px] bg-transparent border-none cursor-pointer">
                <Plus size={14} /> Add New
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="border border-[#d9d9d9] rounded-[8px] p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#ececec] px-2 py-0.5 font-['Inter:Bold',sans-serif] font-bold text-[11px] text-black tracking-[0.5px]">{addr.label}</span>
                    <button className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-0">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <p className="font-['Inter',sans-serif] text-[16px] text-black tracking-[-0.48px]">{addr.name}</p>
                  <p className="font-['Inter',sans-serif] text-[14px] text-[#a6a6a6] tracking-[-0.42px]">{addr.address}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Phone size={12} className="text-[#a6a6a6]" />
                    <span className="font-['Inter',sans-serif] text-[12px] text-[#a6a6a6] tracking-[-0.36px]">{addr.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Order History */}
          <section className="mt-12">
            <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-black tracking-[-0.9px]">Order History</h2>
            <div className="mt-6 border border-[#d9d9d9] rounded-[4px] overflow-hidden">
              <div className="grid grid-cols-5 bg-[#f5f5f5] px-6 py-3">
                {["ORDER ID", "DATE", "STATUS", "TOTAL PRICE", "ACTION"].map(h => (
                  <span key={h} className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-[#a6a6a6] tracking-[0.5px]">{h}</span>
                ))}
              </div>
              {orderHistory.map((order) => (
                <div key={order.id} className="grid grid-cols-5 px-6 py-4 border-t border-[#ececec] items-center">
                  <span className="font-['Inter:Bold',sans-serif] font-bold text-[14px] text-[#511e0b] tracking-[-0.42px]">{order.id}</span>
                  <span className="font-['Inter',sans-serif] text-[14px] text-black tracking-[-0.42px]">{order.date}</span>
                  <span className={`font-['Inter:Bold',sans-serif] font-bold text-[12px] tracking-[0.5px] ${order.statusColor}`}>{order.status}</span>
                  <span className="font-['Inter',sans-serif] text-[14px] text-black tracking-[-0.42px]">{order.price}</span>
                  <button className="bg-transparent border-none cursor-pointer p-0 w-fit">
                    <Eye size={20} className="text-[#a6a6a6]" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
