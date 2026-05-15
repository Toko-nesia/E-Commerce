"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { PageWrapper } from "@/app/components/layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";
import { resolveImagePath } from "@/lib/image-paths";
import { formatJpyFromIdr } from "@/domain/formatters";
import type { Category, Product } from "@/types/database";

const PRODUCTS_PER_PAGE = 9;

type SortOption = "relevance" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Lowest Price" },
  { value: "price-desc", label: "Highest Price" },
];

function stockLabel(stock: number) {
  if (stock <= 0) return { label: "Out of stock", className: "text-[#df0000]" };
  if (stock <= 5) return { label: `Only ${stock} left`, className: "text-amber-700" };
  return { label: `${stock} in stock`, className: "text-[#0f7a43]" };
}

function ProductCard({ product, exchangeRate }: { product: Product; exchangeRate: number | null }) {
  const stock = stockLabel(Number(product.stock ?? 0));
  const priceJpy = formatJpyFromIdr(product.price_raw, exchangeRate);

  return (
    <Link href={`/product/${product.id}`} className="no-underline group min-w-0">
      <div className="bg-white rounded-xl overflow-hidden border border-[#e0e0e0] hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5 flex flex-col h-full min-w-0">
        <div className="relative w-full aspect-[4/3] bg-[#f8f8f8] overflow-hidden">
          { }
          <img
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={resolveImagePath(product.image)}
          />
          {product.badge && (
            <div className={`absolute top-3 left-3 ${product.badge_color || "bg-white"} ${product.badge_width || "w-14"} h-6 rounded-full shadow-sm flex items-center justify-center`}>
              <span className="font-medium text-[12px] text-black truncate px-2">{product.badge}</span>
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1 min-w-0">
          <p className="text-[12px] text-[#6b6b6b] uppercase tracking-wider truncate">{product.category}</p>
          <p className="font-bold text-[14px] text-black mt-1 line-clamp-2 leading-snug flex-1 min-w-0">{product.name}</p>
          <p className="font-bold text-[15px] text-[#511e0b] mt-1 truncate">{product.price}</p>
          {priceJpy && <p className="text-[12px] text-[#6b6b6b] mt-0.5 truncate">{priceJpy}</p>}
          <p className={`text-[12px] mt-0.5 font-medium ${stock.className}`}>{stock.label}</p>
        </div>
      </div>
    </Link>
  );
}

export function CatalogView({ categorySlug = "" }: { categorySlug?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        sort: sortBy,
        page: String(currentPage),
        pageSize: String(PRODUCTS_PER_PAGE),
      });
      if (categorySlug) params.set("category", categorySlug);
      const res = await fetch(`/api/catalog/products?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");

      setProducts(data.products ?? []);
      setCategories(data.categories ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [categorySlug, currentPage, searchQuery, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/exchange-rate", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setExchangeRate(typeof data?.rate === "number" ? data.rate : null))
      .catch(() => setExchangeRate(null));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("catalog-products-stock")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchData())
      .subscribe();

    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const title = activeCategory?.name ?? "All Products";
  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? "Relevance";
  const showingFrom = Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, total);
  const showingTo = Math.min(currentPage * PRODUCTS_PER_PAGE, total);

  const allCategoryCount = useMemo(
    () => categories.reduce((sum, category) => sum + Number(category.count ?? 0), 0) || total,
    [categories, total],
  );

  if (error) {
    return (
      <PageWrapper>
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8">
          <div className="text-center py-24">
            <p className="text-[#6b6b6b] text-[15px] mb-4">Something went wrong: {error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 bg-[#511e0b] text-white text-[14px] font-bold px-5 py-2.5 rounded-lg hover:bg-[#3d1608] transition-colors border-none cursor-pointer"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileSidebarOpen((value) => !value)}
            className="flex items-center gap-2 text-[14px] text-[#511e0b] font-medium border border-[#511e0b] rounded-lg px-4 py-2 bg-transparent cursor-pointer hover:bg-[#faf5ee] transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filter categories
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <aside className={`${mobileSidebarOpen ? "block" : "hidden"} md:block w-full md:w-[220px] shrink-0`}>
            <div className="bg-white rounded-xl border border-[#b0b0b0] flex items-center px-4 py-2.5 gap-2 shadow-sm">
              <Search size={15} className="text-[#6b6b6b] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
                placeholder="Search products..."
                className="flex-1 min-w-0 text-[14px] text-[#511e0b] bg-transparent border-none outline-none placeholder:text-[#999999]"
              />
            </div>

            <div className="mt-6 md:border-r-2 md:border-[#791111] md:pr-4">
              <h3 className="font-bold text-[16px] text-[#511e0b] mb-3 uppercase tracking-wide">Categories</h3>
              <Link
                href="/shop"
                className={`block text-[14px] no-underline py-1.5 transition-colors ${categorySlug ? "text-[#511e0b] hover:font-medium" : "font-bold text-[#511e0b]"}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                All <span className="text-[#8a5a00]">({allCategoryCount})</span>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop/category/${category.slug}`}
                  className={`block text-[14px] no-underline py-1.5 transition-all text-[#511e0b] ${activeCategory?.slug === category.slug ? "font-bold" : "hover:font-medium"}`}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  {category.name} <span className="text-[#8a5a00]">({category.count})</span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="min-w-0">
                <h1 className="font-bold text-[28px] md:text-[32px] text-[#511e0b] truncate">{title}</h1>
                {!loading && (
                  <p className="text-[13px] text-[#6b6b6b] mt-0.5">
                    {total > 0 ? `Showing ${showingFrom}-${showingTo} of ${total} products` : "No products found"}
                  </p>
                )}
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSortMenu((value) => !value)}
                  className="flex items-center gap-2 text-[13px] text-[#511e0b] bg-white border border-[#b0b0b0] rounded-lg px-4 py-2 cursor-pointer hover:border-[#511e0b] transition-colors"
                >
                  Sort: <span className="font-medium">{currentSortLabel}</span>
                  <ChevronDown size={14} />
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-10 bg-white border border-[#d5d5d5] rounded-xl shadow-lg z-10 min-w-[170px] overflow-hidden">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setShowSortMenu(false); setCurrentPage(1); }}
                        className={`w-full text-left px-4 py-3 text-[13px] hover:bg-[#faf5ee] bg-transparent border-none cursor-pointer transition-colors ${sortBy === option.value ? "font-bold text-[#511e0b]" : "text-black"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl overflow-hidden border border-[#e0e0e0] animate-pulse">
                    <div className="w-full aspect-[4/3] bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-[#6b6b6b] text-[15px]">No products found.</p>
                <button onClick={() => setSearchQuery("")} className="mt-3 text-[#511e0b] underline text-[13px] bg-transparent border-none cursor-pointer">
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} exchangeRate={exchangeRate} />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg border border-[#b0b0b0] text-[14px] font-medium flex items-center justify-center bg-white cursor-pointer hover:border-[#511e0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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

