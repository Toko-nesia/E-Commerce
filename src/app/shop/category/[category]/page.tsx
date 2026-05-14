"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageWrapper } from "../../../components/layout/PageWrapper";
import { Search, ChevronDown, RefreshCw } from "lucide-react";
import { resolveImagePath } from "@/lib/image-paths";
import type { Product, Category } from "@/types/database";

type SortOption = "relevansi" | "harga-asc" | "harga-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevansi", label: "Relevansi" },
  { value: "harga-asc", label: "Harga Terendah" },
  { value: "harga-desc", label: "Harga Tertinggi" },
];

export default function ShopCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevansi");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams({
        category,
        search: searchQuery,
        sort: sortBy === "harga-asc" ? "price-asc" : sortBy === "harga-desc" ? "price-desc" : "relevance",
        page: "1",
        pageSize: "50",
      });
      const res = await fetch(`/api/catalog/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
      }
      setLoading(false);
    }
    fetchData();
  }, [category, searchQuery, sortBy]);

  const activeCategory = categories.find((c) => c.slug === category);

  const title = activeCategory ? activeCategory.name.toUpperCase() : "SEMUA PRODUK";
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Relevansi";

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-24">
          <RefreshCw size={24} className="animate-spin text-[#511e0b]" />
          <span className="ml-3 text-[15px] text-[#6b6b6b]">Loading products...</span>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-[220px] shrink-0 border-r-2 border-[#791111] pr-6">
          <div className="bg-white rounded-xl border border-[#b0b0b0] flex items-center px-4 py-2.5 gap-2 shadow-sm">
            <Search size={15} className="text-[#6b6b6b] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="flex-1 text-[14px] text-[#511e0b] bg-transparent border-none outline-none placeholder:text-[#999999]"
            />
          </div>

          <h3 className="font-bold text-[16px] text-[#511e0b] mt-6 mb-3 uppercase tracking-wide">Kategori</h3>
          <Link
            href="/shop"
            className="block text-[14px] text-[#511e0b] no-underline py-1.5 hover:font-medium transition-all"
          >
            Semua <span className="text-[#fbbe48]">({products.length})</span>
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/category/${c.slug}`}
              className={`block text-[14px] no-underline py-1.5 transition-all text-[#511e0b] ${
                activeCategory?.slug === c.slug ? "font-bold" : "hover:font-medium"
              }`}
            >
              {c.name} <span className="text-[#fbbe48]">({c.count})</span>
            </Link>
          ))}
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="font-bold text-[28px] md:text-[32px] text-[#511e0b]">{title}</h1>
              <p className="text-[13px] text-[#6b6b6b] mt-0.5">Menampilkan {products.length} produk</p>
            </div>

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-2 text-[13px] text-[#511e0b] bg-white border border-[#b0b0b0] rounded-lg px-4 py-2 cursor-pointer hover:border-[#511e0b] transition-colors"
              >
                Urutkan: <span className="font-medium">{currentSortLabel}</span>
                <ChevronDown size={14} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-10 bg-white border border-[#d5d5d5] rounded-xl shadow-lg z-10 min-w-[160px] overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-[13px] hover:bg-[#faf5ee] bg-transparent border-none cursor-pointer transition-colors ${sortBy === opt.value ? "font-bold text-[#511e0b]" : "text-black"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[#6b6b6b] text-[15px]">Produk tidak ditemukan.</p>
              <button onClick={() => setSearchQuery("")} className="mt-3 text-[#511e0b] underline text-[13px] bg-transparent border-none cursor-pointer">
                Reset pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <Link href={`/product/${p.id}`} key={p.id} className="no-underline group">
                  <div className="bg-white rounded-xl overflow-hidden border border-[#e0e0e0] hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
                    <div className="relative w-full h-[180px] md:h-[205px] bg-[#f8f8f8] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={p.name}
                        className={`absolute max-w-none object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105 ${p.img_style || "inset-0 w-full h-full"}`}
                        src={resolveImagePath(p.image)}
                      />
                      <div className={`absolute top-3 left-3 ${p.badge_color} ${p.badge_width || "w-14"} h-6 rounded-full shadow-sm flex items-center justify-center`}>
                        <span className="font-medium text-[12px] text-black">{p.badge}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider">{p.category}</p>
                      <p className="font-bold text-[14px] text-black mt-1 line-clamp-2 leading-snug">{p.name}</p>
                      <p className="font-bold text-[14px] text-[#511e0b] mt-1">{p.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
