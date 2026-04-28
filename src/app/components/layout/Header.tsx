"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/about", label: "ABOUT" },
    { href: "/shop", label: "SHOP" },
  ];

  return (
    <header className="bg-white h-20 flex items-center px-6 md:px-12 justify-between sticky top-0 z-50 w-full shadow-sm">
      {/* Logo */}
      <Link
        href="/"
        className="font-bold text-[18px] text-black tracking-tight no-underline flex items-center gap-2 shrink-0"
      >
        <span>トコネシア</span>
        <span className="text-gray-300 font-normal">|</span>
        <span className="text-[#ba2f2f]">Tokonesia</span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map(({ href, label }) => {
          const active =
            href === "/"
              ? isActive("/") && !isActive("/about") && !isActive("/shop")
              : isActive(href) || (href === "/shop" && isActive("/product"));
          return (
            <Link
              key={href}
              href={href}
              className={`text-[15px] text-black tracking-wide no-underline transition-colors hover:text-[#511e0b] ${active ? "font-bold text-[#511e0b]" : "font-normal"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Cart icon with badge */}
        <Link href="/cart" className="relative text-black" aria-label="Shopping cart">
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#511e0b] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-[badgePop_0.3s_ease-out]">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Link>

        {/* Auth */}
        {isLoggedIn ? (
          <Link href="/profile" className="text-black" aria-label="Profile">
            <User size={22} />
          </Link>
        ) : (
          <div className="hidden md:flex items-center gap-1 text-[15px] tracking-wide">
            <Link href="/login" className="text-black no-underline hover:text-[#511e0b] transition-colors">
              LOGIN
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/register" className="text-[#df0000] no-underline hover:text-[#b00000] transition-colors">
              REGISTER
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-black bg-transparent border-none cursor-pointer p-0"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-20 left-0 right-0 bg-white shadow-lg z-40 flex flex-col py-4 px-6 gap-4 md:hidden">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-[15px] text-black no-underline font-medium py-2 border-b border-gray-100"
            >
              {label}
            </Link>
          ))}
          {!isLoggedIn && (
            <div className="flex gap-4 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-black no-underline text-[15px]">LOGIN</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="text-[#df0000] no-underline text-[15px]">REGISTER</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
