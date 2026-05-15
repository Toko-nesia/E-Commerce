import Link from "next/link";
import { resolveImagePath } from "@/lib/image-paths";

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-[#791111] w-full overflow-hidden">
      <div className="absolute inset-0 opacity-35 md:opacity-80 overflow-hidden pointer-events-none">
        { }
        <img
          alt=""
          className="absolute h-full md:h-[250%] left-0 max-w-none top-0 md:top-[-130%] w-full object-cover"
          src={resolveImagePath("/images/HomeBeforeLogin/d9118e975ef4e144a8e808ccd3a55684c0248095.png")}
        />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 px-4 sm:px-6 md:px-16 py-8 md:py-12 text-center md:text-left">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-['Inter',sans-serif] text-[14px] text-black">
          <Link href="/" className="no-underline text-black">Home</Link>
          <Link href="/about" className="no-underline text-black">About</Link>
          <Link href="/shop" className="no-underline text-black">Shop</Link>
        </nav>
        <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] sm:text-[22px] text-black text-center leading-tight">
          <span className="text-[#ba2f2f]">Tokonesia</span><br />
          <span>トコネシア</span>
        </p>
        <p className="font-['Inter',sans-serif] text-[13px] text-black text-center md:text-right">
          Copyright © 2026 Tokonesia
        </p>
      </div>
    </footer>
  );
}

