import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface PageWrapperProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  mobileFooter?: boolean; // if false, footer is hidden on mobile
}

export function PageWrapper({ children, showHeader = true, showFooter = true, mobileFooter = true }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showFooter && (
        <div className={mobileFooter ? undefined : "hidden lg:block"}>
          <Footer />
        </div>
      )}
    </div>
  );
}
