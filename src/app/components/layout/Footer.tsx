import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-[#791111] h-[228px] w-full overflow-hidden">
      <div className="absolute inset-0 opacity-80 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[250%] left-0 max-w-none top-[-130%] w-full" src="/images/HomeBeforeLogin/d9118e975ef4e144a8e808ccd3a55684c0248095.png" />
      </div>
      <div className="relative z-10 flex items-center justify-between px-16 pt-12">
        <nav className="flex gap-6 font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px]">
          <Link href="/" className="no-underline text-black">HOME</Link>
          <Link href="/about" className="no-underline text-black">ABOUT</Link>
          <Link href="/shop" className="no-underline text-black">SHOP</Link>
        </nav>
        <p className="font-['Inter:Bold',sans-serif] font-bold text-[36px] text-black text-center tracking-[-1.08px]">
          LOREM<br />IPSUM
        </p>
        <p className="font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px]">
          Copyright © 2026 Lorem Ipsum
        </p>
      </div>
    </footer>
  );
}
