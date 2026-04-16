import { Link, useLocation } from "react-router";
import { ShoppingCart, User } from "lucide-react";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn = false }: HeaderProps) {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white h-24 flex items-center px-8 md:px-16 justify-between sticky top-0 z-50 w-full">
      <Link to="/" className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px] no-underline">
        LOREM IPSUM
      </Link>
      <nav className="flex items-center gap-8">
        <Link to="/" className={`font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] no-underline ${isActive("/") && !isActive("/about") && !isActive("/shop") ? "font-bold" : ""}`}>
          HOME
        </Link>
        <Link to="/about" className={`font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] no-underline ${isActive("/about") ? "font-bold" : ""}`}>
          ABOUT
        </Link>
        <Link to="/shop" className={`font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] no-underline ${isActive("/shop") || isActive("/product") ? "font-bold" : ""}`}>
          SHOP
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link to="/shop" className="text-black"><ShoppingCart size={24} /></Link>
        {isLoggedIn ? (
          <Link to="/profile" className="text-black"><User size={24} /></Link>
        ) : (
          <div className="flex items-center gap-1 font-['Inter',sans-serif] text-[20px] tracking-[-0.6px]">
            <Link to="/login" className="text-black no-underline">LOGIN</Link>
            <span className="text-black">|</span>
            <Link to="/register" className="text-[#df0000] no-underline">SIGN IN</Link>
          </div>
        )}
      </div>
    </header>
  );
}
