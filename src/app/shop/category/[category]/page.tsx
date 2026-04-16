"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageWrapper } from "../../../components/layout/PageWrapper";
import { Search, ChevronDown } from "lucide-react";
import { products } from "@/data/products";
import { categories, getCategoryBySlug } from "@/data/categories";

export default function ShopCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = getCategoryBySlug(category);
  const filteredProducts = activeCategory
    ? products.filter(p => p.category === activeCategory.name)
    : products;

  const title = activeCategory ? activeCategory.name.toUpperCase() : "ALL PRODUCT";
  const showingText = `Showing all ${filteredProducts.length} product`;

  return (
    <PageWrapper>
      <div className="flex max-w-[1200px] mx-auto px-8 py-8 min-h-[800px]">
        {/* Sidebar */}
        <aside className="w-[250px] shrink-0 pr-8 border-r border-[#791111]">
          <div className="bg-white rounded-full border border-[#d9d9d9] flex items-center px-4 py-3 gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Product..."
              className="flex-1 font-['Inter',sans-serif] text-[16px] text-[#511e0b] bg-transparent border-none outline-none placeholder-[#511e0b]"
            />
            <Search size={16} className="text-black" />
          </div>
          <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-[#511e0b] tracking-[-0.72px] mt-8">CATEGORIES</h3>
          <div className="mt-4 space-y-2">
            {categories.map(c => (
              <Link
                key={c.slug}
                href={`/shop/category/${c.slug}`}
                className={`block font-['Inter',sans-serif] text-[16px] tracking-[-0.48px] no-underline ${activeCategory?.slug === c.slug ? "font-bold text-[#511e0b]" : "text-[#511e0b]"}`}
              >
                {c.name} <span className="text-[#fbbe48]">({c.count})</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 pl-8">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] text-[#511e0b] tracking-[-1.44px]">{title}</h1>
          <div className="flex justify-between items-center mt-4">
            <p className="font-['Inter',sans-serif] text-[15px] text-[#511e0b] tracking-[-0.45px]">{showingText}</p>
            <button className="flex items-center gap-1 font-['Inter',sans-serif] text-[15px] text-[#511e0b] tracking-[-0.45px] bg-transparent border-none cursor-pointer">
              Shorting by <ChevronDown size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            {filteredProducts.map((p, i) => (
              <Link href={`/product/${p.id}`} key={`${p.id}-${i}`} className="no-underline group">
                <div className="bg-white rounded-[7px] overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative w-full h-[205px] bg-[#bebebe] overflow-hidden">
                    <img
                      alt={p.name}
                      className={`absolute max-w-none object-cover pointer-events-none ${p.img_style || "inset-0 w-full h-full"}`}
                      src={p.image}
                    />
                    <div className={`absolute top-[14px] left-[14px] ${p.badge_color} ${p.badge_width || "w-[56px]"} h-[23px] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center`}>
                      <span className="font-['Roboto:Medium',sans-serif] font-medium text-[14px] text-black tracking-[0.1px]">{p.badge}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-['Inter',sans-serif] text-[13px] text-black tracking-[-0.39px]">{p.category}</p>
                    <p className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-black tracking-[-0.48px] mt-1 line-clamp-2">{p.name}</p>
                    <p className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#511e0b] tracking-[-0.48px] mt-1">{p.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
