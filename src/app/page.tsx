"use client";

import Link from "next/link";
import { PageWrapper } from "./components/layout/PageWrapper";
import { trendingProducts, homeLogos, whyChooseUs } from "@/data/brands";

export default function HomePage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative h-[420px] md:h-[558px] w-full overflow-hidden">
        <img
          alt=""
          className="absolute h-[120.94%] left-0 max-w-none top-[-19.71%] w-full object-cover"
          src="/images/HomeBeforeLogin/ddf830bb09d6517538362b5457cbc8292017ec7e.png"
        />
        <div className="relative z-10 px-8 md:px-16 pt-20 md:pt-32">
          <h1 className="font-bold text-[26px] md:text-[34px] text-white tracking-tight flex items-center gap-2 md:gap-3">
            <span>トコネシア</span>
            <span className="text-gray-300 font-normal">|</span>
            <span>Tokonesia</span>
          </h1>
          <p className="text-[16px] md:text-[22px] text-white max-w-[540px] mt-3 leading-relaxed">
            Membawa kebaikan Nusantara ke jantung Jepang.
            Temukan produk Indonesia terbaik, langsung dari sumbernya.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-6 bg-[#511e0b] text-white text-[14px] font-bold px-6 py-3 rounded-lg hover:bg-[#3d1608] transition-colors no-underline"
          >
            Belanja Sekarang →
          </Link>
        </div>
      </section>

      {/* Brand Logos */}
      <section className="flex items-center justify-center flex-wrap gap-8 md:gap-12 py-6 md:py-8 px-8 md:px-16 bg-[#f8f8f8]">
        {homeLogos.map((logo, i) => (
          <div key={i} className={logo.containerClass}>
            <img alt={logo.name} className={logo.imgClass} src={logo.img} />
          </div>
        ))}
      </section>

      {/* Trending Now */}
      <section className="bg-[#faf5ee] py-10 md:py-12 px-8 md:px-16">
        <p className="text-center text-[13px] text-[#511e0b] tracking-widest uppercase">
          POPULAR PRODUCT
        </p>
        <h2 className="text-center font-bold text-[26px] md:text-[30px] text-[#511e0b] tracking-tight mt-1">
          Trending Now
        </h2>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-8 md:mt-10">
          {trendingProducts.map((p) => (
            <Link href="/shop" key={p.name} className="flex flex-col items-center no-underline group">
              <div className="relative w-[160px] md:w-[205px] h-[175px] md:h-[224px] overflow-hidden shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] group-hover:scale-[1.03] transition-transform duration-200 rounded-sm">
                <img
                  alt={p.name}
                  className={`absolute max-w-none object-cover pointer-events-none ${p.imgStyle}`}
                  src={p.image}
                />
                <div className="absolute top-[8px] left-[10px] bg-white rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-3 py-0.5">
                  <span className="font-medium text-[12px] text-black">TOP</span>
                </div>
              </div>
              <p className="text-[15px] text-[#511e0b] text-center mt-2.5">{p.name}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/shop"
            className="inline-block border border-[#511e0b] text-[#511e0b] text-[14px] font-bold px-6 py-2.5 rounded-lg hover:bg-[#511e0b] hover:text-white transition-colors no-underline"
          >
            Lihat Semua Produk
          </Link>
        </div>
      </section>

      {/* New Product */}
      <section className="relative mx-4 md:mx-6 overflow-hidden rounded-xl">
        <div className="h-[400px] md:h-[620px] w-full relative overflow-hidden">
          <img
            alt=""
            className="absolute h-[118.87%] left-0 max-w-none top-[-8.49%] w-full object-cover"
            src="/images/HomeBeforeLogin/5bc42449b61397e41571ffa7cc94f48332069351.png"
          />
        </div>
        <div className="absolute top-8 md:top-12 left-8 md:left-16 z-10">
          <h2 className="font-bold text-[24px] md:text-[30px] text-[#511e0b] tracking-tight">
            NEW PRODUCT
          </h2>
          <p className="text-[14px] md:text-[16px] text-[#511e0b] max-w-[280px] md:max-w-[335px] mt-2 leading-relaxed">
            Step into comfort with Aerostreet —
            High-quality local sneakers from Indonesia designed for everyday wear.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-4 bg-[#511e0b] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#3d1608] transition-colors no-underline"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16 px-8 md:px-16">
        <h2 className="text-center font-bold text-[26px] md:text-[30px] text-[#090909] tracking-tight">
          WHY CHOOSE US
        </h2>
        <p className="text-center text-[15px] md:text-[16px] text-[#555] max-w-[540px] mx-auto mt-3 leading-relaxed">
          We make it easy, safe, and reliable to shop your favorite Indonesian products delivered
          right to your door.
        </p>
        <div className="w-[240px] h-px bg-[#FBBE48] mx-auto mt-6" />
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-10">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="flex flex-col items-center max-w-[200px]">
              <div className="w-[64px] h-[64px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={item.title}
                  className="w-full h-full object-contain"
                  src={item.icon}
                />
              </div>
              <h3 className="font-bold text-[15px] text-[#090909] text-center mt-3">{item.title}</h3>
              <p className="text-[13px] text-[#555] text-center mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}
