import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-[#791111] w-full overflow-hidden">
      <div className="absolute inset-0 opacity-80 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[250%] left-0 max-w-none top-[-130%] w-full" src="/images/HomeBeforeLogin/d9118e975ef4e144a8e808ccd3a55684c0248095.png" />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-16 py-8 md:py-12">
        <nav className="flex gap-6 font-['Inter',sans-serif] text-[14px] text-black tracking-[-0.3px]">
          <Link href="/" className="no-underline text-black">Home</Link>
          <Link href="/about" className="no-underline text-black">About</Link>
          <Link href="/shop" className="no-underline text-black">Shop</Link>
        </nav>
        <p className="font-['Inter:Bold',sans-serif] font-bold text-[22px] text-black text-center tracking-[-0.5px]">
          <span className="text-[#ba2f2f]">Tokonesia</span><br />
          <span>トコネシア</span>
        </p>
        <p className="font-['Inter',sans-serif] text-[13px] text-black tracking-[-0.3px] text-center md:text-right">
          Copyright © 2026 Tokonesia
        </p>
      </div>
    </footer>
  );
}
