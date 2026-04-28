"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Beranda",
  "/admin/products": "Beranda > Produk > Produk Saya",
  "/admin/products/add": "Beranda > Produk > Tambah Produk Baru",
  "/admin/orders": "Beranda > Pesanan Masuk",
  "/admin/categories": "Beranda > Kategori",
};

function getAdminBreadcrumb(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
  const editMatch = pathname.match(/^\/admin\/products\/(\d+)\/edit$/);
  if (editMatch) return "Beranda > Produk > Edit Produk";
  return "Beranda";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin/products")) {
      setProductOpen(true);
    }
  }, [pathname]);

  const breadcrumb = getAdminBreadcrumb(pathname);

  const isActive = (href: string) => pathname === href;
  const isProductActive = pathname.startsWith("/admin/products");

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ── Fixed Header ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-24 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.25)] flex items-center">
        {/* Logo — aligns with sidebar width */}
        <div className="w-[211px] flex-shrink-0 flex items-center justify-center gap-1 px-4">
          <Link href="/admin" className="flex items-center gap-1 no-underline">
            <span className="font-bold text-[18px] text-black">トコネシア</span>
            <span className="text-gray-300 font-light px-1">|</span>
            <span className="font-bold text-[18px] text-[#BA2F2F]">Tokonesia</span>
          </Link>
        </div>

        {/* Vertical red divider */}
        <div className="w-px h-[22px] bg-[#BA2F2F] flex-shrink-0" />

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center px-6">
          <p className="text-[14px] text-gray-600">{breadcrumb}</p>
        </div>
      </header>

      {/* ── Fixed Sidebar ────────────────────────────────────────────── */}
      <aside className="fixed top-24 left-0 bottom-0 w-[211px] bg-white shadow-[2px_2px_10px_rgba(0,0,0,0.25)] z-40 overflow-y-auto">
        <nav className="py-4">
          {/* Dashboard */}
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 ${
              isActive("/admin")
                ? "font-bold text-[#511E0B]"
                : "text-gray-700"
            }`}
          >
            <LayoutDashboard
              size={18}
              className={isActive("/admin") ? "text-[#511E0B]" : "text-gray-500"}
            />
            <span>Dashboard</span>
          </Link>

          {/* Produk — collapsible accordion */}
          <div>
            <button
              onClick={() => setProductOpen((prev) => !prev)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 ${
                isProductActive ? "font-bold text-[#511E0B]" : "text-gray-700"
              }`}
            >
              <Package
                size={18}
                className={isProductActive ? "text-[#511E0B]" : "text-gray-500"}
              />
              <span className="flex-1 text-left">Produk</span>
              {productOpen ? (
                <ChevronDown size={15} className="text-gray-400" />
              ) : (
                <ChevronRight size={15} className="text-gray-400" />
              )}
            </button>

            {productOpen && (
              <div className="pl-11 pr-3 flex flex-col gap-0.5 pb-1">
                <Link
                  href="/admin/products"
                  className={`block py-2 px-3 text-[13px] rounded transition-colors hover:bg-gray-50 ${
                    isActive("/admin/products")
                      ? "font-bold text-[#511E0B]"
                      : "text-gray-600"
                  }`}
                >
                  Produk Saya
                </Link>
                <Link
                  href="/admin/products/add"
                  className={`block py-2 px-3 text-[13px] rounded transition-colors hover:bg-gray-50 ${
                    isActive("/admin/products/add")
                      ? "font-bold text-[#511E0B]"
                      : "text-gray-600"
                  }`}
                >
                  Tambah Produk Baru
                </Link>
              </div>
            )}
          </div>

          {/* Pesanan Masuk */}
          <Link
            href="/admin/orders"
            className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 ${
              isActive("/admin/orders")
                ? "font-bold text-[#511E0B]"
                : "text-gray-700"
            }`}
          >
            <ShoppingBag
              size={18}
              className={
                isActive("/admin/orders") ? "text-[#511E0B]" : "text-gray-500"
              }
            />
            <span>Pesanan Masuk</span>
          </Link>

          {/* Kategori */}
          <Link
            href="/admin/categories"
            className={`flex items-center gap-3 px-5 py-3 text-[14px] transition-colors hover:bg-gray-50 ${
              isActive("/admin/categories")
                ? "font-bold text-[#511E0B]"
                : "text-gray-700"
            }`}
          >
            <Tag
              size={18}
              className={
                isActive("/admin/categories")
                  ? "text-[#511E0B]"
                  : "text-gray-500"
              }
            />
            <span>Kategori</span>
          </Link>
        </nav>
      </aside>

      {/* ── Scrollable Main Content ───────────────────────────────────── */}
      <main className="ml-[211px] pt-24">
        <div className="p-6 min-h-[calc(100vh-96px)]">{children}</div>
      </main>
    </div>
  );
}
