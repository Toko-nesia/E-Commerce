"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Check, Edit3, Phone } from "lucide-react";
import { Footer } from "../components/layout/Footer";
import { PaymentOptionModal } from "../components/modals/PaymentOptionModal";
import { AddressModal } from "../components/modals/AddressModal";
import { EditAddressModal } from "../components/modals/EditAddressModal";
import { getCartItemKey, getCartItemPrice, getCartItemUnitPrice, useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { resolveImagePath } from "@/lib/image-paths";
import { normalizePhoneNumber } from "@/domain/validation";
import type { Address } from "@/types/database";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const paymentMethods = [
  { id: "bank_transfer", name: "Bank Payment" },
  { id: "credit_card", name: "Debit/Credit Card" },
];

type ShippingMethodCode = "fedex" | "internal_courier";

interface ShippingRateOption {
  method: ShippingMethodCode;
  label: string;
  shippingCost: number;
  serviceName: string;
  estimatedDelivery?: string;
  estimatedDeliveryDate?: string;
  requiresTracking: boolean;
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

function formatRp(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, canCheckout, clearCart, resolveCartStock, updateItemNote } = useCart();
  const { user } = useAuth();

  const [paymentModal, setPaymentModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("bank_transfer");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirectingToResult, setRedirectingToResult] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [saveAddressError, setSaveAddressError] = useState<string | null>(null);

  // Shipping methods
  const [shippingOptions, setShippingOptions] = useState<ShippingRateOption[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethodCode | "">("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const shippingCacheRef = useRef(new Map<string, {
    rates: ShippingRateOption[];
    warnings?: string[];
  }>());
  const lastShippingRequestKeyRef = useRef<string | null>(null);

  // Exchange rate
  const [exchangeRate, setExchangeRate] = useState<number>(0.0093);
  const [exchangeRateUpdatedAt, setExchangeRateUpdatedAt] = useState<string | null>(null);

  // Redirect if cart doesn't meet minimum weight
  useEffect(() => {
    if (!canCheckout && items.length > 0) {
      router.replace("/cart");
    }
  }, [canCheckout, items.length, router]);

  useEffect(() => {
    if (!user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [router, user]);

  // Fetch addresses from Supabase
  const fetchAddresses = useCallback(async (autoSelectLatest = false) => {
    if (!user?.id) {
      setAddressesLoading(false);
      return;
    }
    setAddressesLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setAddresses(data);
      if (autoSelectLatest) {
        // After adding a new address, select the most recently created one
        setSelectedAddress(data[0].id);
      } else {
        const defaultAddr = data.find((a: Address) => a.is_default);
        setSelectedAddress((prev) => prev || (defaultAddr ? defaultAddr.id : data[0].id));
      }
    } else {
      setAddresses([]);
    }
    setAddressesLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAddresses(false);
  }, [fetchAddresses]);

  const handleSaveAddress = useCallback(async (data: {
    name: string;
    phone: string;
    address: string;
    label: string;
    postalCode: string;
    countryCode: string;
  }) => {
    if (!user?.id) {
      setSaveAddressError("User session not found. Please refresh the page.");
      return;
    }
    setIsSavingAddress(true);
    setSaveAddressError(null);

    try {
      const normalizedPhone = normalizePhoneNumber(data.phone);
      const supabase = createClient();
      const isFirst = addresses.length === 0;

      // Insert without .single() to avoid PGRST116 if RLS blocks the returning SELECT
      const { error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          label: data.label.trim() || null,
          name: data.name.trim(),
          phone: normalizedPhone,
          address: data.address.trim(),
          full_address: data.address.trim(),
          postal_code: data.postalCode.trim(),
          country_code: data.countryCode.trim().toUpperCase() || "JP",
          is_default: isFirst,
        });

      if (error) {
        console.error("Address insert error:", error);
        setSaveAddressError("Failed to save address. Please try again.");
        setIsSavingAddress(false);
        return;
      }

      // Refresh address list — auto-select the newly added address
      await fetchAddresses(true);
      setIsSavingAddress(false);
      setEditAddressModal(false);
    } catch (err) {
      console.error("Unexpected error saving address:", err);
      setSaveAddressError("An unexpected error occurred. Please try again.");
      setIsSavingAddress(false);
    }
  }, [user?.id, addresses.length, fetchAddresses]);

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await fetch("/api/exchange-rate");
        if (res.ok) {
          const data = await res.json();
          if (data.rate) {
            setExchangeRate(data.rate);
            setExchangeRateUpdatedAt(data.updated_at ?? null);
          }
        }
      } catch {
        // Keep the default display rate when the exchange-rate endpoint is unavailable.
      }
    };
    fetchExchangeRate();
  }, []);

  const currentAddress = addresses.find((a) => a.id === selectedAddress) || addresses[0];
  const selectedShippingOption = useMemo(() => {
    return shippingOptions.find((option) => option.method === selectedShippingMethod) ?? shippingOptions[0] ?? null;
  }, [selectedShippingMethod, shippingOptions]);

  const shippingQuoteKey = useMemo(() => {
    if (!currentAddress || items.length === 0) return "";
    return JSON.stringify({
      addressId: currentAddress.id,
      items: items
        .map(({ product, qty, customAmountRaw }) => ({
          productId: product.id,
          quantity: qty,
          customAmountRaw: customAmountRaw ?? null,
        }))
        .sort((a, b) => a.productId - b.productId || (a.customAmountRaw ?? 0) - (b.customAmountRaw ?? 0)),
    });
  }, [currentAddress, items]);

  // Fetch FedEx shipping rate only when the actual address/cart quote key changes.
  const fetchShippingRate = useCallback(async (address: Address, quoteKey: string) => {
    const cached = shippingCacheRef.current.get(quoteKey);
    if (cached) {
      setShippingOptions(cached.rates);
      setSelectedShippingMethod((current) =>
        current && cached.rates.some((rate) => rate.method === current)
          ? current
          : cached.rates[0]?.method ?? ""
      );
      setShippingError(null);
      setShippingLoading(false);
      return;
    }

    if (lastShippingRequestKeyRef.current === quoteKey && shippingOptions.length > 0) {
      return;
    }

    lastShippingRequestKeyRef.current = quoteKey;
    setShippingLoading(true);
    setShippingError(null);
    if (items.length === 0) {
      setShippingOptions([]);
      setSelectedShippingMethod("");
      setShippingLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: address.id,
          items: items.map(({ product, qty, customAmountRaw }) => ({
            productId: product.id,
            quantity: qty,
            customAmountRaw: customAmountRaw ?? null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Shipping rate unavailable");
      }

      const data = await res.json();
      const rates = Array.isArray(data.rates) ? data.rates as ShippingRateOption[] : [];
      if (rates.length === 0) {
        throw new Error("No shipping method is available");
      }
      setShippingOptions(rates);
      setSelectedShippingMethod((current) =>
        current && rates.some((rate) => rate.method === current)
          ? current
          : rates[0].method
      );
      shippingCacheRef.current.set(quoteKey, { rates, warnings: data.warnings });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Shipping rate unavailable";
      setShippingError(msg);
      setShippingOptions([]);
      setSelectedShippingMethod("");
    } finally {
      setShippingLoading(false);
    }
  }, [items, shippingOptions.length]);

  useEffect(() => {
    if (currentAddress && shippingQuoteKey) {
      fetchShippingRate(currentAddress, shippingQuoteKey);
    }
  }, [currentAddress, fetchShippingRate, shippingQuoteKey]);

  // Handle address selection from modal — re-fetch shipping for new address
  const handleAddressSelect = useCallback((id: string) => {
    setSelectedAddress(id);
    // fetchShippingRate will be triggered by the currentAddress effect above
  }, []);

  const serviceFee = Math.round(totalPrice * 0.01);
  const shippingCost = selectedShippingOption?.shippingCost ?? null;
  const grandTotal = totalPrice + (shippingCost ?? 0) + serviceFee;
  const grandTotalJpy = Math.round(grandTotal * exchangeRate);

  const checkoutSessionFingerprint = useMemo(() => {
    return JSON.stringify({
      addressId: selectedAddress,
      shippingMethod: selectedShippingMethod,
      items: items
        .map(({ product, qty, customAmountRaw, buyerNote }) => ({
          id: product.id,
          qty,
          customAmountRaw: customAmountRaw ?? null,
          buyerNote: buyerNote ?? "",
        }))
        .sort((a, b) => a.id - b.id || (a.customAmountRaw ?? 0) - (b.customAmountRaw ?? 0)),
    });
  }, [items, selectedAddress, selectedShippingMethod]);

  useEffect(() => {
    setIdempotencyKey(createIdempotencyKey());
  }, [checkoutSessionFingerprint]);

  const handlePay = async () => {
    if (isProcessing || !currentAddress || !selectedShippingOption) return;
    setIsProcessing(true);
    setPayError(null);

    try {
      const stockIssues = await resolveCartStock();
      if (stockIssues.length > 0) {
        throw new Error(stockIssues[0]);
      }

      const res = await fetch("/api/checkout/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          addressId: currentAddress.id,
          shippingMethod: selectedShippingOption.method,
          paymentMethod: selectedPayment,
          note,
          cartItems: items.map(({ product, qty, customAmountRaw, buyerNote }) => ({
            productId: product.id,
            quantity: qty,
            customAmountRaw: customAmountRaw ?? null,
            buyerNote: buyerNote ?? "",
          })),
          items: items.map(({ product, qty, customAmountRaw, buyerNote }) => ({
            productId: product.id,
            quantity: qty,
            customAmountRaw: customAmountRaw ?? null,
            buyerNote: buyerNote ?? "",
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.snapToken) {
        throw new Error(data.error ?? "Failed to create payment");
      }
      const resultOrderId = data.orderId as string;

      // Load Midtrans Snap JS if not already loaded
      if (!window.snap) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
              ? "https://app.midtrans.com/snap/snap.js"
              : "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute(
            "data-client-key",
            process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""
          );
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
          document.head.appendChild(script);
        });
      }

      let snapOutcomeHandled = false;
      const redirectToResult = (href: string) => {
        if (snapOutcomeHandled) return;
        snapOutcomeHandled = true;
        setRedirectingToResult(true);
        clearCart();
        setIdempotencyKey(createIdempotencyKey());
        router.replace(href);
      };

      window.snap!.pay(data.snapToken, {
        onSuccess: () => {
          redirectToResult(`/order-success?orderId=${resultOrderId}`);
        },
        onPending: () => {
          redirectToResult(`/order-pending?orderId=${resultOrderId}`);
        },
        onError: () => {
          redirectToResult(`/order-failed?orderId=${resultOrderId}`);
        },
        onClose: () => {
          redirectToResult(`/order-pending?orderId=${resultOrderId}`);
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setPayError(msg);
      setIsProcessing(false);
    }
  };

  if (redirectingToResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f8f8f8]">
        <LoadingSpinner label="Redirecting to your order..." className="text-[#6b6b6b] text-[16px]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f8f8]">
        <p className="text-[#6b6b6b] text-[16px]">Your cart is empty.</p>
        <Link href="/shop" className="text-[#511e0b] underline text-[15px]">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f8f8] min-h-screen">
      {/* Header */}
      <header className="bg-white h-20 flex items-center px-6 md:px-12 justify-between sticky top-0 z-40 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-bold text-[18px] text-black tracking-tight no-underline flex items-center gap-2"
          >
            <span>トコネシア</span>
            <span className="text-[#ba2f2f]"> | Tokonesia</span>
          </Link>
          <span className="text-[#ba2f2f] font-normal">|</span>
          <span className="text-[18px] text-black">Checkout</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Shield size={22} className="text-[#15a15b]" />
            <Check size={9} className="text-[#15a15b] absolute top-[6px] left-[6px]" />
          </div>
          <div>
            <p className="text-[14px] text-black font-medium">Shop Protection</p>
            <p className="text-[12px] text-[#6b6b6b]">Your purchase is secure and protected</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-[1200px] mx-auto">
        {/* Left Column */}
        <div className="flex-1 p-6 md:p-10 md:pr-12">
          {/* Address */}
          <h2 className="font-bold text-[22px] text-[#511e0b]">Shipping Address</h2>
          {addressesLoading ? (
            <div className="border border-[#511e0b] rounded-lg p-5 mt-3 bg-white flex items-center justify-center">
              <LoadingSpinner label="Loading addresses..." className="text-[14px] text-[#6b6b6b]" />
            </div>
          ) : currentAddress ? (
            <div className={`border rounded-xl p-5 mt-3 relative bg-white ${currentAddress.is_default ? "border-[#511e0b]" : "border-[#b0b0b0]"}`}>
              <div className="flex items-center gap-2 mb-3 pr-8">
                {currentAddress.label && (
                  <span className="bg-[#511e0b] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{currentAddress.label}</span>
                )}
                {currentAddress.is_default && (
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">DEFAULT</span>
                )}
              </div>
              <p className="font-medium text-[15px] text-black">{currentAddress.name}</p>
              <p className="text-[13px] text-[#6b6b6b] mt-0.5 leading-relaxed">{currentAddress.address}</p>
              {currentAddress.postal_code && (
                <p className="text-[12px] text-[#6b6b6b] mt-0.5">{currentAddress.postal_code}, {currentAddress.country_code || "JP"}</p>
              )}
              <div className="flex items-center gap-1 mt-2">
                <Phone size={11} className="text-[#6b6b6b]" />
                <span className="text-[13px] text-[#6b6b6b]">{currentAddress.phone}</span>
              </div>
              <button
                onClick={() => setAddressModal(true)}
                className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-0 text-[#6b6b6b] hover:text-black transition-colors"
              >
                <Edit3 size={18} />
              </button>
            </div>
          ) : (
            <div className="border border-[#511e0b] rounded-lg p-5 mt-3 bg-white">
              <p className="text-[14px] text-[#6b6b6b]">No addresses found.</p>
              <button
                onClick={() => setEditAddressModal(true)}
                className="mt-2 text-[#511e0b] underline text-[14px] bg-transparent border-none cursor-pointer p-0"
              >
                Add an address
              </button>
            </div>
          )}

          {/* Shipping */}
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Shipping</h2>
          <div className="border border-[#511e0b] rounded-lg p-5 mt-3 bg-white">
            {shippingLoading ? (
              <LoadingSpinner label={selectedShippingOption ? "Updating shipping options..." : "Fetching shipping options..."} className="text-[14px] text-[#6b6b6b]" />
            ) : shippingError ? (
              <p className="text-[14px] text-[#df0000]">{shippingError}</p>
            ) : shippingOptions.length > 0 ? (
              <div className="space-y-3">
                {shippingOptions.map((option) => (
                  <label
                    key={option.method}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedShippingMethod === option.method
                        ? "border-[#511e0b] bg-[#FDF9F5]"
                        : "border-[#d8c8bd] bg-white hover:bg-[#f8f8f8]"
                    }`}
                  >
                    <span className="flex items-start gap-3 min-w-0">
                      <input
                        type="radio"
                        name="shipping-method"
                        value={option.method}
                        checked={selectedShippingMethod === option.method}
                        onChange={() => setSelectedShippingMethod(option.method)}
                        className="mt-1 accent-[#511e0b] shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block font-bold text-[15px] text-black">{option.label}</span>
                        {option.estimatedDelivery && (
                          <span className="block text-[13px] text-[#6b6b6b] mt-0.5">
                            Estimated delivery: {option.estimatedDelivery}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-[14px] font-bold text-[#511e0b] shrink-0">{formatRp(option.shippingCost)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#6b6b6b]">Select an address to see available shipping methods.</p>
            )}
          </div>

          {/* Payment */}
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Payment</h2>
          <div className="border border-[#511e0b] rounded-lg p-5 mt-3 flex items-center relative bg-white">
            <div className="bg-[#e0e0e0] border-[#511e0b] border border-solid rounded-lg w-[48px] h-[48px] flex items-center justify-center shrink-0">
              <Shield size={20} className="text-[#511e0b]" />
            </div>
            <p className="font-bold text-[15px] text-black ml-4">
              {paymentMethods.find((m) => m.id === selectedPayment)?.name ?? selectedPayment}
            </p>
            <button
              onClick={() => setPaymentModal(true)}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
            >
              <Edit3 size={18} />
            </button>
          </div>

          {/* Note */}
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Order note (optional)</h2>
          <div className="border border-[#511e0b] rounded-lg p-4 mt-3 flex items-center bg-white">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a general note for this order."
              className="text-[14px] text-[#6b6b6b] flex-1 bg-transparent border-none outline-none placeholder:text-[#999999]"
            />
            <Edit3 size={18} className="text-[#6b6b6b] shrink-0 ml-2" />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="w-full lg:w-[440px] bg-[#FDF9F5] shadow-sm border border-[#e0e0e0] p-6 md:p-10 lg:min-h-[calc(100vh-80px)]">
          <h2 className="font-bold text-[22px] text-[#511e0b]">Order</h2>

          {/* Cart Items */}
          <div className="mt-5 space-y-4">
            {items.map((item) => {
              const { product, qty } = item;
              const itemKey = getCartItemKey(item);
              const isCustomBox = product.pricing_type === "custom_amount" && product.category === "Jastip Box";
              return (
              <div key={itemKey} className="flex gap-3">
                <div className="w-[72px] h-[72px] overflow-hidden shrink-0 rounded-md bg-white">
                  <img alt={product.name} className="w-full h-full object-cover" src={resolveImagePath(product.image)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] text-black leading-snug line-clamp-2">{product.name}</p>
                  <p className="text-[13px] text-[#6b6b6b] mt-0.5">
                    {getCartItemPrice(item)} x {qty}
                  </p>
                  <p className="text-[13px] font-bold text-[#511e0b] mt-0.5">{formatRp(getCartItemUnitPrice(item) * qty)}</p>
                  <label className="mt-2 block text-[12px] font-semibold text-[#511e0b]" htmlFor={`checkout-item-note-${itemKey}`}>
                    Item note (optional)
                  </label>
                  <textarea
                    id={`checkout-item-note-${itemKey}`}
                    value={item.buyerNote ?? ""}
                    onChange={(event) => updateItemNote(itemKey, event.target.value)}
                    maxLength={2000}
                    rows={2}
                    placeholder={
                      isCustomBox
                        ? "Paste product links, item list, quantities, sizes, colors, flavors, and budget allocation."
                        : "Add size, color, flavor, or item-specific request details."
                    }
                    className="mt-1 w-full resize-y rounded-lg border border-[#d8c8bd] bg-white px-3 py-2 text-[12px] text-black outline-none focus:border-[#511e0b]"
                  />
                </div>
              </div>
              );
            })}
          </div>

          {/* Price Breakdown */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between">
              <span className="text-[14px] text-black">Product subtotal</span>
              <span className="text-[14px] text-[#6b6b6b]">{formatRp(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-black">{selectedShippingOption?.label ?? "Shipping"}</span>
              <span className="text-[14px] text-[#6b6b6b]">
                {shippingLoading
                  ? <LoadingSpinner size={14} />
                  : shippingCost !== null
                  ? formatRp(shippingCost)
                  : shippingError
                  ? "Unavailable"
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-black">Service fee</span>
              <span className="text-[14px] text-[#6b6b6b]">{formatRp(serviceFee)}</span>
            </div>
          </div>

          <div className="h-px bg-black/20 mt-6" />

          <div className="flex justify-between mt-4">
            <span className="font-bold text-[18px] text-black">Total Payment</span>
            <span className="font-bold text-[18px] text-black">{formatRp(grandTotal)}</span>
          </div>
          <p className="font-bold text-[16px] text-[#df0000] text-right mt-1">
            ¥{grandTotalJpy.toLocaleString("ja-JP")}
          </p>
          {exchangeRateUpdatedAt && (
            <p className="text-[11px] text-[#6b6b6b] text-right mt-0.5">
              Rate as of: {new Date(exchangeRateUpdatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          )}

          {shippingError && (
            <p className="text-[13px] text-[#df0000] mt-3">
              Shipping unavailable: {shippingError}. Please try again or contact support.
            </p>
          )}

          {payError && (
            <p className="text-[13px] text-[#df0000] mt-3 text-center">{payError}</p>
          )}

          <button
            onClick={handlePay}
            disabled={
              addressesLoading ||
              shippingLoading ||
              !currentAddress ||
              !selectedShippingOption ||
              isProcessing
            }
            className="w-full bg-[#511e0b] text-white rounded-lg h-14 mt-6 font-bold text-[16px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? <LoadingSpinner label="Processing..." /> : "Pay Now"}
          </button>
        </div>
      </div>

      {/* Modals */}
      <PaymentOptionModal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        selected={selectedPayment}
        onSelect={setSelectedPayment}
      />
      <AddressModal
        isOpen={addressModal}
        onClose={() => setAddressModal(false)}
        addresses={addresses}
        selectedId={selectedAddress}
        onSelect={handleAddressSelect}
        onAddNew={() => {
          setAddressModal(false);
          setEditAddressModal(true);
        }}
      />
      <EditAddressModal
        isOpen={editAddressModal}
        onClose={() => {
          setEditAddressModal(false);
          setSaveAddressError(null);
        }}
        onSave={handleSaveAddress}
        isSaving={isSavingAddress}
        saveError={saveAddressError}
        initialData={{ name: "", phone: "", fullAddress: "", label: "", postalCode: "", countryCode: "JP" }}
      />

      {/* Footer — desktop only */}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
