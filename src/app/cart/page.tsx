"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { PageWrapper } from "@/app/components/layout/PageWrapper";
import { getCartItemKey, getCartItemPrice, getCartItemUnitPrice, useCart } from "@/contexts/cart-context";
import { resolveImagePath } from "@/lib/image-paths";

function formatRp(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

export default function CartPage() {
  const { items, updateQty, updateItemNote, removeFromCart, totalPrice, totalWeight, canCheckout, resolveCartStock } = useCart();
  const [stockMessages, setStockMessages] = useState<string[]>([]);

  const serviceFee = Math.round(totalPrice * 0.01);
  const subtotalWithFee = totalPrice + serviceFee;

  const refreshCartStock = useCallback(async () => {
    try {
      const issues = await resolveCartStock();
      setStockMessages(issues);
    } catch (error) {
      setStockMessages([error instanceof Error ? error.message : "Failed to refresh cart stock."]);
    }
  }, [resolveCartStock]);

  useEffect(() => {
    refreshCartStock();
    const onFocus = () => refreshCartStock();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCartStock]);

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
              {stockMessages.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                  {stockMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              )}
              {items.map((item) => {
                const { product, qty, variant } = item;
                const itemKey = getCartItemKey(item);
                const isCustomBox = product.pricing_type === "custom_amount" && product.category === "Jastip Box";
                return (
                  <div
                    key={itemKey}
                    className="bg-white rounded-xl shadow-sm border border-[#e0e0e0] p-4 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    <div className="w-[88px] h-[88px] shrink-0 overflow-hidden rounded-lg bg-[#F8F8F8]">
                      <img
                        src={resolveImagePath(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-black leading-snug line-clamp-2">{product.name}</p>
                      <p className="text-[13px] text-[#6b6b6b] mt-0.5">{product.category}{variant ? ` / ${variant.name}` : ""}</p>
                      <p className="font-bold text-[15px] text-[#511e0b] mt-1">{getCartItemPrice(item)}</p>
                      <label className="mt-3 block text-[12px] font-semibold text-[#511e0b]" htmlFor={`item-note-${itemKey}`}>
                        Item note (optional)
                      </label>
                      <textarea
                        id={`item-note-${itemKey}`}
                        value={item.buyerNote ?? ""}
                        onChange={(event) => updateItemNote(itemKey, event.target.value)}
                        maxLength={2000}
                        rows={3}
                        placeholder={
                          isCustomBox
                            ? "Paste product links, item list, quantities, sizes, colors, flavors, and budget allocation."
                            : "Add size, color, flavor, or item-specific request details."
                        }
                        className="mt-1 w-full resize-y rounded-lg border border-[#d8c8bd] bg-white px-3 py-2 text-[13px] text-black outline-none focus:border-[#511e0b]"
                      />
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 self-end sm:self-start">
                      <div className="flex items-center border border-[#511e0b] rounded-md px-3 h-9 gap-3">
                        <button
                          onClick={() => updateQty(itemKey, qty - 1)}
                          className="bg-transparent border-none cursor-pointer text-[#511e0b] p-0 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-[14px] text-[#511e0b] font-medium min-w-[20px] text-center">{qty}</span>
                        <button
                          onClick={() => {
                            const result = updateQty(itemKey, qty + 1);
                            setStockMessages(result.message ? [result.message] : []);
                          }}
                          disabled={qty >= (variant?.stock ?? product.stock ?? 0)}
                          className="bg-transparent border-none cursor-pointer text-[#511e0b] p-0 hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemKey)}
                        className="text-[#6b6b6b] hover:text-[#DF0000] transition-colors bg-transparent border-none cursor-pointer"
                        aria-label="Remove item"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[320px] shrink-0 bg-[#FDF9F5] rounded-xl shadow-sm border border-[#e0e0e0] p-6 lg:sticky lg:top-28">
              <h2 className="font-bold text-[19px] text-black mb-4">Order Summary</h2>

              <div className="flex flex-col gap-2 mb-4">
                {items.map((item) => (
                  <div key={getCartItemKey(item)} className="flex justify-between text-[13px]">
                    <span className="text-[#6b6b6b] line-clamp-1 max-w-[160px]">
                      {(item.variant ? `${item.product.name} (${item.variant.name})` : item.product.name)} x{item.qty}
                    </span>
                    <span className="text-black font-medium shrink-0 ml-2">{formatRp(getCartItemUnitPrice(item) * item.qty)}</span>
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
                  <span className="text-[#6b6b6b] italic">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6b6b6b]">Service fee (1%)</span>
                  <span className="text-black">{formatRp(serviceFee)}</span>
                </div>
              </div>

              <div className="border-t border-[#d0d0d0] mt-4 pt-4 flex justify-between">
                <span className="font-bold text-[17px] text-black">Subtotal</span>
                <span className="font-bold text-[17px] text-[#511e0b]">{formatRp(subtotalWithFee)}</span>
              </div>

              <div className="mt-3 text-[12px] text-[#6b6b6b]">
                Total weight: {totalWeight.toFixed(1)} kg
              </div>

              {!canCheckout && (
                <p className="mt-2 text-[12px] text-[#DF0000]">
                  Minimum order weight is 21 kg. Add {(21 - totalWeight).toFixed(1)} kg more to checkout.
                </p>
              )}

              {canCheckout ? (
                <Link
                  href="/checkout"
                  className="block w-full mt-4 bg-[#511e0b] text-white text-center rounded-lg py-3 font-bold text-[15px] no-underline hover:bg-[#3d1608] transition-colors"
                >
                  Checkout
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full mt-4 bg-[#b0b0b0] text-white text-center rounded-lg py-3 font-bold text-[15px] cursor-not-allowed"
                >
                  Checkout
                </button>
              )}

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
