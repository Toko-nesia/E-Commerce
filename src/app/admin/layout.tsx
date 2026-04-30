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
} from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Beranda",
  "/admin/products": "Beranda > Produk > Produk Saya",
  "/admin/products/add": "Beranda > Produk > Tambah Produk Baru",
  "/admin/orders": "Beranda > Pesanan Masuk",
  "/admin/categories": "Beranda > Kategori",
  "/admin/refunds": "Beranda > Refund Requests",
  "/admin/settings": "Beranda > Pengaturan",
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

  const NavContent = () => (
    <nav className="py-4">
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
      <aside className={`fixed top-16 left-0 bottom-0 w-[211px] bg-white shadow-[2px_2px_10px_rgba(0,0,0,0.15)] z-40 overflow-y-auto transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-3 right-3 bg-transparent border-none cursor-pointer text-gray-500 hover:text-black p-0"
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
        <NavContent />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="lg:ml-[211px] pt-16">
        <div className="p-4 md:p-6 min-h-[calc(100vh-64px)]">{children}</div>
      </main>
    </div>
  );
}
