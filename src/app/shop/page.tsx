"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { products } from "@/data/products";
import { categories } from "@/data/categories";

const PRODUCTS_PER_PAGE = 9;

type SortOption = "relevance" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Lowest Price" },
  { value: "price-desc", label: "Highest Price" },
];

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price_raw - b.price_raw);
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price_raw - a.price_raw);

    return result;
  }, [searchQuery, sortBy]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Relevance";

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8">
        {/* Mobile filter toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileSidebarOpen((v) => !v)}
            className="flex items-center gap-2 text-[14px] text-[#511e0b] font-medium border border-[#511e0b] rounded-lg px-4 py-2 bg-transparent cursor-pointer hover:bg-[#faf5ee] transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filter Categories
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`${mobileSidebarOpen ? "block" : "hidden"} md:block w-full md:w-[220px] shrink-0`}>
            {/* Search */}
            <div className="bg-white rounded-xl border border-[#b0b0b0] flex items-center px-4 py-2.5 gap-2 shadow-sm">
              <Search size={15} className="text-[#6b6b6b] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 text-[14px] text-[#511e0b] bg-transparent border-none outline-none placeholder:text-[#999999]"
              />
            </div>

            {/* Categories */}
            <div className="mt-6 border-r-2 border-[#791111] pr-4">
              <h3 className="font-bold text-[16px] text-[#511e0b] mb-3 uppercase tracking-wide">Categories</h3>
              <Link
                href="/shop"
                className="block text-[14px] font-bold text-[#511e0b] no-underline py-1.5 hover:text-[#3d1608]"
                onClick={() => setMobileSidebarOpen(false)}
              >
                All <span className="text-[#fbbe48]">({products.length})</span>
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop/category/${c.slug}`}
                  className="block text-[14px] text-[#511e0b] no-underline py-1.5 hover:font-medium transition-all"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  {c.name} <span className="text-[#fbbe48]">({c.count})</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="font-bold text-[28px] md:text-[32px] text-[#511e0b]">All Products</h1>
                <p className="text-[13px] text-[#6b6b6b] mt-0.5">
                  Showing {Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filtered.length)} of {filtered.length} products
                </p>
              </div>

              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-2 text-[13px] text-[#511e0b] bg-white border border-[#b0b0b0] rounded-lg px-4 py-2 cursor-pointer hover:border-[#511e0b] transition-colors"
                >
                  Sort: <span className="font-medium">{currentSortLabel}</span>
                  <ChevronDown size={14} />
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-10 bg-white border border-[#d5d5d5] rounded-xl shadow-lg z-10 min-w-[160px] overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); setCurrentPage(1); }}
                        className={`w-full text-left px-4 py-3 text-[13px] hover:bg-[#faf5ee] bg-transparent border-none cursor-pointer transition-colors ${sortBy === opt.value ? "font-bold text-[#511e0b]" : "text-black"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Product Grid */}
            {paginated.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-[#6b6b6b] text-[15px]">No products found for &ldquo;{searchQuery}&rdquo;</p>
                <button onClick={() => handleSearch("")} className="mt-3 text-[#511e0b] underline text-[13px] bg-transparent border-none cursor-pointer">
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {paginated.map((p) => (
                  <Link href={`/product/${p.id}`} key={p.id} className="no-underline group">
                    <div className="bg-white rounded-xl overflow-hidden border border-[#e0e0e0] hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5 flex flex-col h-full">
                      <div className="relative w-full aspect-[4/3] bg-[#f8f8f8] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          src={p.image}
                        />
                        <div className={`absolute top-3 left-3 ${p.badge_color} ${p.badge_width || "w-14"} h-6 rounded-full shadow-sm flex items-center justify-center`}>
                          <span className="font-medium text-[12px] text-black">{p.badge}</span>
                        </div>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-[12px] text-[#6b6b6b] uppercase tracking-wider">{p.category}</p>
                        <p className="font-bold text-[14px] text-black mt-1 line-clamp-2 leading-snug flex-1">{p.name}</p>
                        <p className="font-bold text-[15px] text-[#511e0b] mt-1">{p.price}</p>
                        <p className="text-[12px] text-[#6b6b6b] mt-0.5">Stock: {p.stock}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg border border-[#b0b0b0] text-[14px] font-medium flex items-center justify-center bg-white cursor-pointer hover:border-[#511e0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-[14px] font-bold flex items-center justify-center cursor-pointer border transition-colors ${
                      page === currentPage
                        ? "bg-[#511e0b] text-white border-[#511e0b]"
                        : "bg-white text-black border-[#b0b0b0] hover:border-[#511e0b]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-lg border border-[#b0b0b0] text-[14px] font-medium flex items-center justify-center bg-white cursor-pointer hover:border-[#511e0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
