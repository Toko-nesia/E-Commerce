"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Beranda",
  "/admin/products": "Beranda > Produk > Produk Saya",
  "/admin/products/add": "Beranda > Produk > Tambah Produk Baru",
  "/admin/orders": "Beranda > Pesanan Masuk",
  "/admin/categories": "Beranda > Kategori",
  "/admin/refunds": "Beranda > Refund Requests",
  "/admin/settings": "Beranda > Pengaturan",
  "/admin/profile": "Beranda > Profil Admin",
};

function getAdminBreadcrumb(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
  const editMatch = pathname.match(/^\/admin\/products\/(\d+)\/edit$/);
  if (editMatch) return "Beranda > Produk > Edit Produk";
  return "Beranda";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [productOpen, setProductOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (pathname.startsWith("/admin/products")) setProductOpen(true);
  }, [pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const breadcrumb = getAdminBreadcrumb(pathname);
  const isActive = (href: string) => pathname === href;
  const isProductActive = pathname.startsWith("/admin/products");

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Navigation Links ── */}
      <nav className="py-4 flex-1 overflow-y-auto">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 no-underline ${
            isActive("/admin") ? "font-bold text-[#511E0B]" : "text-gray-700"
          }`}
        >
          <LayoutDashboard size={18} className={isActive("/admin") ? "text-[#511E0B]" : "text-gray-500"} />
          <span>Dashboard</span>
        </Link>

        <div>
          <button
            onClick={() => setProductOpen((prev) => !prev)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 bg-transparent border-none cursor-pointer ${
              isProductActive ? "font-bold text-[#511E0B]" : "text-gray-700"
            }`}
          >
            <Package size={18} className={isProductActive ? "text-[#511E0B]" : "text-gray-500"} />
            <span className="flex-1 text-left">Produk</span>
            {productOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
          </button>
          {productOpen && (
            <div className="pl-11 pr-3 flex flex-col gap-0.5 pb-1">
              <Link href="/admin/products" className={`block py-2 px-3 text-[13px] rounded transition-colors hover:bg-gray-50 no-underline ${isActive("/admin/products") ? "font-bold text-[#511E0B]" : "text-gray-600"}`}>
                Produk Saya
              </Link>
              <Link href="/admin/products/add" className={`block py-2 px-3 text-[13px] rounded transition-colors hover:bg-gray-50 no-underline ${isActive("/admin/products/add") ? "font-bold text-[#511E0B]" : "text-gray-600"}`}>
                Tambah Produk Baru
              </Link>
            </div>
          )}
        </div>

        <Link href="/admin/orders" className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 no-underline ${isActive("/admin/orders") ? "font-bold text-[#511E0B]" : "text-gray-700"}`}>
          <ShoppingBag size={18} className={isActive("/admin/orders") ? "text-[#511E0B]" : "text-gray-500"} />
          <span>Pesanan Masuk</span>
        </Link>

        <Link href="/admin/categories" className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 no-underline ${isActive("/admin/categories") ? "font-bold text-[#511E0B]" : "text-gray-700"}`}>
          <Tag size={18} className={isActive("/admin/categories") ? "text-[#511E0B]" : "text-gray-500"} />
          <span>Kategori</span>
        </Link>

        <Link href="/admin/refunds" className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 no-underline ${isActive("/admin/refunds") ? "font-bold text-[#511E0B]" : "text-gray-700"}`}>
          <RotateCcw size={18} className={isActive("/admin/refunds") ? "text-[#511E0B]" : "text-gray-500"} />
          <span>Refunds</span>
        </Link>

        <Link href="/admin/settings" className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 no-underline ${isActive("/admin/settings") ? "font-bold text-[#511E0B]" : "text-gray-700"}`}>
          <Settings size={18} className={isActive("/admin/settings") ? "text-[#511E0B]" : "text-gray-500"} />
          <span>Pengaturan</span>
        </Link>
      </nav>

      {/* ── Profile & Logout (bottom) ── */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        {/* Profile card — links to /admin/profile */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors no-underline group mb-1"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#511E0B] flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-[11px] font-bold">{initials}</span>
            )}
          </div>
          {/* Name & email */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
              {user?.full_name || "Admin"}
            </p>
            <p className="text-[11px] text-gray-400 truncate leading-tight">
              {user?.email || ""}
            </p>
          </div>
          <User size={14} className="text-gray-400 shrink-0 group-hover:text-[#511E0B] transition-colors" />
        </Link>

        {/* Logout button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer"
        >
          <LogOut size={15} className="shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ── Fixed Header ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="lg:hidden flex items-center justify-center w-16 h-16 bg-transparent border-none cursor-pointer text-gray-700 shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        {/* Logo */}
        <div className="hidden lg:flex w-[211px] flex-shrink-0 items-center justify-center gap-1 px-4">
          <Link href="/admin" className="flex items-center gap-1 no-underline">
            <span className="font-bold text-[15px] text-black">トコネシア</span>
            <span className="text-gray-300 font-light px-1">|</span>
            <span className="font-bold text-[15px] text-[#BA2F2F]">Tokonesia</span>
          </Link>
        </div>
        {/* Mobile logo */}
        <Link href="/admin" className="lg:hidden flex items-center gap-1 no-underline">
          <span className="font-bold text-[15px] text-black">トコネシア</span>
          <span className="text-gray-300 font-light px-1">|</span>
          <span className="font-bold text-[15px] text-[#BA2F2F]">Tokonesia</span>
        </Link>

        <div className="hidden lg:block w-px h-[18px] bg-[#BA2F2F] flex-shrink-0" />

        <div className="flex-1 hidden lg:flex items-center px-6">
          <p className="text-[13px] text-gray-500">{breadcrumb}</p>
        </div>
      </header>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`fixed top-16 left-0 bottom-0 w-[211px] bg-white shadow-[2px_2px_10px_rgba(0,0,0,0.15)] z-40 flex flex-col transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-3 right-3 bg-transparent border-none cursor-pointer text-gray-500 hover:text-black p-0 z-10"
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="lg:ml-[211px] pt-16">
        <div className="p-4 md:p-6 min-h-[calc(100vh-64px)]">{children}</div>
      </main>

      {/* ── Logout Confirmation Modal ─────────────────────────────── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-black">Logout Confirmation</h3>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-[#6b6b6b] hover:text-black bg-transparent border-none cursor-pointer p-0"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-[14px] text-[#6b6b6b] mb-6">
              Are you sure you want to log out from your account?
            </p>
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
    </div>
  );
}
