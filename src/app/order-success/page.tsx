"use client";

import Link from "next/link";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export default function OrderSuccessPage() {
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    // Generate order number once on mount
    setOrderNumber(`#ZB-${Date.now().toString().slice(-6)}`);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF9F5] flex flex-col">
      {/* Header */}
      <header className="bg-white h-20 flex items-center px-6 md:px-12 shadow-sm">
        <Link href="/" className="font-bold text-[18px] text-black tracking-tight no-underline flex items-center gap-2">
          <span>トコネシア</span>
          <span className="text-gray-300 font-normal">|</span>
          <span className="text-[#ba2f2f]">Tokonesia</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-[480px] w-full text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#e8f5ee] rounded-full p-5">
              <CheckCircle size={52} className="text-[#15a15b]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-bold text-[26px] text-[#511e0b] mb-2">Order Placed!</h1>
          <p className="text-[14px] text-[#6b6b6b] mb-6">
            Thank you for shopping at Tokonesia. Your order is being processed.
          </p>

          {/* Order number */}
          {orderNumber && (
            <div className="bg-[#FDF9F5] rounded-xl px-6 py-4 mb-6">
              <p className="text-[12px] text-[#6b6b6b] uppercase tracking-wider mb-1">Order Number</p>
              <p className="font-bold text-[22px] text-[#511e0b]">{orderNumber}</p>
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-[#f8f8f8] rounded-xl p-4 text-left">
              <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Shipping</p>
              <p className="text-[13px] font-medium text-black">Air Shipping</p>
              <p className="text-[12px] text-[#6b6b6b]">Est. Apr 12 – Jun 21</p>
            </div>
            <div className="bg-[#f8f8f8] rounded-xl p-4 text-left">
              <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Status</p>
              <div className="inline-flex items-center gap-1.5 bg-[#FFF3CD] rounded-full px-2 py-0.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBE48] shrink-0" />
                <span className="text-[12px] font-bold text-[#FBBE48]">NEW</span>
              </div>
              <p className="text-[12px] text-[#6b6b6b] mt-1">Will be processed shortly</p>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-[#f8f8f8] rounded-xl p-4 text-left mb-6">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-2">Payment Instructions</p>
            <p className="text-[13px] font-medium text-black mb-1">Transfer to BCA account:</p>
            <p className="text-[13px] text-[#6b6b6b]">Account No.: <span className="font-medium text-black">1234567890</span></p>
            <p className="text-[13px] text-[#6b6b6b]">Account Name: <span className="font-medium text-black">Tokonesia Indonesia</span></p>
            <p className="text-[12px] text-[#6b6b6b] mt-2">After transferring, please confirm payment to our team.</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e0e0e0] mb-8" />

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link
              href="/profile"
              className="w-full bg-[#511e0b] text-white rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors flex items-center justify-center gap-2"
            >
              <Package size={18} />
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="w-full border border-[#511e0b] text-[#511e0b] rounded-xl py-3.5 font-bold text-[15px] no-underline hover:bg-[#faf5ee] transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-[12px] text-[#6b6b6b] mt-6">
            Order confirmation will be sent to your email.
            If you have any questions, contact our team.
          </p>
        </div>
      </div>

      {/* Brand footer */}
      <div className="text-center py-6">
        <p className="text-[12px] text-[#6b6b6b]">
          © 2026 Tokonesia (トコネシア) — Indonesian Products for Japan
        </p>
      </div>
    </div>
  );
}
