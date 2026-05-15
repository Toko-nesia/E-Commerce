"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ShoppingBag } from "lucide-react";

export default function OrderFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-[#FDF9F5] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 max-w-[460px] w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 rounded-full p-5">
            <AlertTriangle size={52} className="text-[#df0000]" />
          </div>
        </div>
        <h1 className="font-bold text-[26px] text-[#511e0b] mb-2">Payment Failed</h1>
        <p className="text-[14px] text-[#6b6b6b] mb-6">
          We could not complete the payment. Your cart was kept so you can try again.
        </p>
        {orderId && (
          <div className="bg-[#FDF9F5] rounded-xl px-4 py-3 mb-6">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Order Reference</p>
            <p className="font-bold text-[13px] text-[#511e0b] break-all">#{orderId}</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/checkout" className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors">
            Try Payment Again
          </Link>
          <Link href="/shop" className="w-full border border-[#511e0b] text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

