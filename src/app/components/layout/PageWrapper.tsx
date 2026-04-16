import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface PageWrapperProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function PageWrapper({ children, isLoggedIn = false, showHeader = true, showFooter = true }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {showHeader && <Header isLoggedIn={isLoggedIn} />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
