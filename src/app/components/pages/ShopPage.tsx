import { useState } from "react";
import { Link, useParams } from "react-router";
import { PageWrapper } from "../layout/PageWrapper";
import { Search, ChevronDown } from "lucide-react";
import imgImage17 from "../../../imports/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png";
import imgImage18 from "../../../imports/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png";
import imgImage19 from "../../../imports/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png";

const allProducts = [
  { id: 1, name: "Cosmos Kipas Angin Wall Fan 16-WFGR", category: "Electronic", price: "Rp397.700", badge: "SALE", badgeColor: "bg-white", image: imgImage17 },
  { id: 2, name: "Atasan Batik Tenun Emma Black", category: "Fashion", price: "Rp131.822", badge: "NEW", badgeColor: "bg-white", image: imgImage18, imgStyle: "left-[-30px] w-[265px] h-[265px] top-[-34px]" },
  { id: 3, name: "Cengkeh Utuh Rempah Organik - B...", category: "Herbs and Spices", price: "Rp22.800", badge: "Pre-order", badgeColor: "bg-[#ef5c5c]", badgeWidth: "w-[81px]", image: imgImage19 },
  { id: 4, name: "Cosmos Kipas Angin Wall Fan 16-WFGR", category: "Electronic", price: "Rp397.700", badge: "SALE", badgeColor: "bg-white", image: imgImage17 },
  { id: 5, name: "Atasan Batik Tenun Emma Black", category: "Fashion", price: "Rp131.822", badge: "NEW", badgeColor: "bg-white", image: imgImage18, imgStyle: "left-[-30px] w-[265px] h-[265px] top-[-34px]" },
  { id: 6, name: "Cengkeh Utuh Rempah Organik - B...", category: "Herbs and Spices", price: "Rp22.800", badge: "Pre-order", badgeColor: "bg-[#ef5c5c]", badgeWidth: "w-[81px]", image: imgImage19 },
  { id: 7, name: "Cosmos Kipas Angin Wall Fan 16-WFGR", category: "Electronic", price: "Rp397.700", badge: "SALE", badgeColor: "bg-white", image: imgImage17 },
  { id: 8, name: "Atasan Batik Tenun Emma Black", category: "Fashion", price: "Rp131.822", badge: "NEW", badgeColor: "bg-white", image: imgImage18, imgStyle: "left-[-30px] w-[265px] h-[265px] top-[-34px]" },
  { id: 9, name: "Cengkeh Utuh Rempah Organik - B...", category: "Herbs and Spices", price: "Rp22.800", badge: "Pre-order", badgeColor: "bg-[#ef5c5c]", badgeWidth: "w-[81px]", image: imgImage19 },
];

const categories = [
  { name: "Electronic", count: 5, slug: "electronic" },
  { name: "Herbs and Spices", count: 4, slug: "herbs-and-spices" },
  { name: "Fashion", count: 6, slug: "fashion" },
];

export default function ShopPage() {
  const { category } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = category ? categories.find(c => c.slug === category) : null;
  const filteredProducts = activeCategory
    ? allProducts.filter(p => p.category === activeCategory.name)
    : allProducts;

  const title = activeCategory ? activeCategory.name.toUpperCase() : "ALL PRODUCT";
  const showingText = activeCategory
    ? `Showing all ${filteredProducts.length} product`
    : `Showing 1-9 of 15 product`;

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
                to={`/shop/category/${c.slug}`}
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
              <Link to={`/product/${p.id}`} key={`${p.id}-${i}`} className="no-underline group">
                <div className="bg-white rounded-[7px] overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative w-full h-[205px] bg-[#bebebe] overflow-hidden">
                    <img
                      alt={p.name}
                      className={`absolute max-w-none object-cover pointer-events-none ${p.imgStyle || "inset-0 w-full h-full"}`}
                      src={p.image}
                    />
                    <div className={`absolute top-[14px] left-[14px] ${p.badgeColor} ${p.badgeWidth || "w-[56px]"} h-[23px] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center`}>
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

          {/* Pagination */}
          {!activeCategory && (
            <div className="flex gap-2 mt-8">
              <div className="bg-[#d9d9d9] w-[31px] h-[31px] flex items-center justify-center font-['Inter:Bold',sans-serif] font-bold text-[16px] cursor-pointer">1</div>
              <div className="bg-[#d9d9d9] w-[31px] h-[31px] flex items-center justify-center font-['Inter:Bold',sans-serif] font-bold text-[16px] cursor-pointer">2</div>
              <div className="bg-[#d9d9d9] w-[31px] h-[31px] flex items-center justify-center cursor-pointer">→</div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
