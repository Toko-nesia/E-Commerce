"use client";

import Link from "next/link";
import { PageWrapper } from "./components/layout/PageWrapper";
import { trendingProducts, homeLogos, whyChooseUs } from "@/data/brands";

export default function HomePage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative h-[558px] w-full overflow-hidden">
        <img alt="" className="absolute h-[120.94%] left-0 max-w-none top-[-19.71%] w-full object-cover" src="/images/HomeBeforeLogin/ddf830bb09d6517538362b5457cbc8292017ec7e.png" />
        <div className="relative z-10 px-16 pt-32">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-white tracking-[-0.9px] flex items-center gap-3">
            <span>ゼンビンズ</span>
            <span className="text-gray-300 font-normal">|</span>
            <span>Zenbins</span>
          </h1>
          <p className="font-['Inter',sans-serif] text-[25px] text-white tracking-[-0.75px] max-w-[601px] mt-2 leading-relaxed">
            Membawa kebaikan Nusantara ke jantung Jepang.
            Temukan produk Indonesia terbaik, langsung dari sumbernya, hanya di Zenbins (ゼンビンズ).
          </p>
        </div>
      </section>

      {/* Brand Logos */}
      <section className="flex items-center justify-center gap-12 py-8 px-16 bg-[#f8f8f8]">
        {homeLogos.map((logo, i) => (
          <div key={i} className={logo.containerClass}>
            <img alt={logo.name} className={logo.imgClass} src={logo.img} />
          </div>
        ))}
      </section>

      {/* Trending Now */}
      <section className="bg-[#faf5ee] py-12 px-16">
        <p className="text-center font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px]">POPULAR PRODUCT</p>
        <h2 className="text-center font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px] mt-1">Trending Now</h2>
        <div className="flex justify-center gap-8 mt-10">
          {trendingProducts.map((p) => (
            <Link href="/shop" key={p.name} className="flex flex-col items-center no-underline group">
              <div className="relative w-[205px] h-[224px] overflow-hidden shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
                <img alt={p.name} className={`absolute max-w-none object-cover pointer-events-none ${p.imgStyle}`} src={p.image} />
                <div className="absolute top-[10px] left-[14px] bg-white rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-3 py-0.5">
                  <span className="font-['Roboto:Medium',sans-serif] font-medium text-[14px] text-black tracking-[0.1px]">TOP</span>
                </div>
              </div>
              <p className="font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px] text-center mt-3">{p.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* New Product */}
      <section className="relative bg-[rgba(255,246,242,0.6)] mx-6 overflow-hidden">
        <div className="h-[530px] w-full relative overflow-hidden">
          <img alt="" className="absolute h-[118.87%] left-0 max-w-none top-[-8.49%] w-full" src="/images/HomeBeforeLogin/5bc42449b61397e41571ffa7cc94f48332069351.png" />
        </div>
        <div className="absolute top-12 left-16 z-10">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px]">NEW PRODUCT</h2>
          <p className="font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px] max-w-[335px] mt-2">
            Step into comfort with Aerostreet<br />
            High-quality local sneakers from Indonesia designed for everyday wear.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-16">
        <h2 className="text-center font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#090909] tracking-[-0.9px]">WHY CHOOSE US</h2>
        <p className="text-center font-['Inter',sans-serif] text-[25px] text-[#090909] tracking-[-0.75px] max-w-[601px] mx-auto mt-4">
          We make it easy, safe, and reliable to shop your favorite Indonesian products delivered right to your door.
        </p>
        <div className="w-[333px] h-px bg-[#FBBE48] mx-auto mt-8" />
        <div className="flex justify-center gap-16 mt-12">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="flex flex-col items-center max-w-[212px]">
              <div className="relative w-[75px] h-[52px] overflow-hidden">
                <img alt="" className={`absolute max-w-none ${item.iconStyle}`} src="/images/HomeBeforeLogin/61ed9253763e955d2f0a7c5290f2a40996acd534.png" />
              </div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#090909] tracking-[-0.45px] text-center mt-4">{item.title}</h3>
              <p className="font-['Inter',sans-serif] text-[11px] text-[#090909] tracking-[-0.33px] text-center mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}
