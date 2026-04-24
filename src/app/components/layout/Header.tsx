"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white h-24 flex items-center px-8 md:px-16 justify-between sticky top-0 z-50 w-full">
      <Link href="/" className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px] no-underline flex items-center gap-2">
        <span>ゼンビンズ</span>
        <span className="text-gray-400 font-normal">|</span>
        <span className="text-[#ba2f2f]">Zenbins</span>
      </Link>
      <nav className="flex items-center gap-8">
        <Link href="/" className={`font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] no-underline ${isActive("/") && !isActive("/about") && !isActive("/shop") ? "font-bold" : ""}`}>
          HOME
        </Link>
        <Link href="/about" className={`font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] no-underline ${isActive("/about") ? "font-bold" : ""}`}>
          ABOUT
        </Link>
        <Link href="/shop" className={`font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] no-underline ${isActive("/shop") || isActive("/product") ? "font-bold" : ""}`}>
          SHOP
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/shop" className="text-black"><ShoppingCart size={24} /></Link>
        {isLoggedIn ? (
          <Link href="/profile" className="text-black"><User size={24} /></Link>
        ) : (
          <div className="flex items-center gap-1 font-['Inter',sans-serif] text-[20px] tracking-[-0.6px]">
            <Link href="/login" className="text-black no-underline">LOGIN</Link>
            <span className="text-black">|</span>
            <Link href="/register" className="text-[#df0000] no-underline">SIGN IN</Link>
          </div>
        )}
      </div>
    </header>
  );
}
