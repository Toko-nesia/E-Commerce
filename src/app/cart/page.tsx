"use client";

import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { PageWrapper } from "@/app/components/layout/PageWrapper";
import { useCart } from "@/contexts/cart-context";

function formatRp(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

export default function CartPage() {
  const { items, updateQty, removeFromCart, totalPrice } = useCart();

  const shipping = 350000;
  const serviceFee = 46000;
  const importTax = Math.round(totalPrice * 0.33);
  const grandTotal = totalPrice + shipping + serviceFee + importTax;

  return (
    <PageWrapper mobileFooter={false}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-10">
        <h1 className="font-bold text-[28px] text-[#511e0b] mb-8">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <ShoppingBag size={56} className="text-[#b0b0b0]" />
            <p className="text-[#6b6b6b] text-[15px]">Your cart is empty.</p>
            <Link
              href="/shop"
              className="bg-[#511e0b] text-white px-6 py-3 rounded-lg font-bold text-[14px] hover:bg-[#3d1608] transition-colors no-underline"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Cart Items */}
            <div className="flex-1 flex flex-col gap-3 w-full">
              {items.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-[#e0e0e0] p-4 flex gap-4 items-center"
                >
                  <div className="w-[88px] h-[88px] shrink-0 overflow-hidden rounded-lg bg-[#F8F8F8]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] text-black leading-snug line-clamp-2">{product.name}</p>
                    <p className="text-[13px] text-[#6b6b6b] mt-0.5">{product.category}</p>
                    <p className="font-bold text-[15px] text-[#511e0b] mt-1">{product.price}</p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {/* Qty control */}
                    <div className="flex items-center border border-[#511e0b] rounded-md px-3 h-9 gap-3">
                      <button
                        onClick={() => updateQty(product.id, qty - 1)}
                        className="bg-transparent border-none cursor-pointer text-[#511e0b] p-0 hover:text-black transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-[14px] text-[#511e0b] font-medium min-w-[20px] text-center">{qty}</span>
                      <button
                        onClick={() => updateQty(product.id, qty + 1)}
                        className="bg-transparent border-none cursor-pointer text-[#511e0b] p-0 hover:text-black transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-[#6b6b6b] hover:text-[#DF0000] transition-colors bg-transparent border-none cursor-pointer"
                      aria-label="Remove item"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[320px] shrink-0 bg-[#FDF9F5] rounded-xl shadow-sm border border-[#e0e0e0] p-6 lg:sticky lg:top-28">
              <h2 className="font-bold text-[19px] text-black mb-4">Order Summary</h2>

              <div className="flex flex-col gap-2 mb-4">
                {items.map(({ product, qty }) => (
                <div key={product.id} className="flex justify-between text-[13px]">
                    <span className="text-[#6b6b6b] line-clamp-1 max-w-[160px]">{product.name} ×{qty}</span>
                    <span className="text-black font-medium shrink-0 ml-2">{formatRp(product.price_raw * qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#d0d0d0] pt-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6b6b6b]">Product subtotal</span>
                  <span className="text-black">{formatRp(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6b6b6b]">Air shipping</span>
                  <span className="text-black">{formatRp(shipping)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6b6b6b]">Service fee</span>
                  <span className="text-black">{formatRp(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6b6b6b]">Import tax (est.)</span>
                  <span className="text-black">{formatRp(importTax)}</span>
                </div>
              </div>

              <div className="border-t border-[#d0d0d0] mt-4 pt-4 flex justify-between">
                <span className="font-bold text-[17px] text-black">Total</span>
                <span className="font-bold text-[17px] text-[#511e0b]">{formatRp(grandTotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full mt-4 bg-[#511e0b] text-white text-center rounded-lg py-3 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors"
              >
                Checkout
              </Link>

              <Link
                href="/shop"
                className="block w-full mt-2 text-center text-[13px] text-[#511e0b] no-underline hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
