"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Check, Edit3 } from "lucide-react";
import { Footer } from "../components/layout/Footer";
import { PaymentOptionModal } from "../components/modals/PaymentOptionModal";
import { AddressModal } from "../components/modals/AddressModal";
import { EditAddressModal } from "../components/modals/EditAddressModal";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/types/database";

const paymentMethods = [
  { id: "bank_transfer", name: "Bank Transfer (BCA/BNI/Mandiri)" },
  { id: "qris", name: "QRIS" },
  { id: "credit_card", name: "Credit / Debit Card" },
  { id: "gopay", name: "GoPay" },
  { id: "shopeepay", name: "ShopeePay" },
];

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalWeight, canCheckout, clearCart } = useCart();
  const { user } = useAuth();

  const [paymentModal, setPaymentModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("bank_transfer");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [saveAddressError, setSaveAddressError] = useState<string | null>(null);

  // FedEx shipping
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingName, setShippingName] = useState<string>("Air Shipping");
  const [shippingDelivery, setShippingDelivery] = useState<string>("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Exchange rate
  const [exchangeRate, setExchangeRate] = useState<number>(0.0093);
  const [exchangeRateUpdatedAt, setExchangeRateUpdatedAt] = useState<string | null>(null);

  // Redirect if cart doesn't meet minimum weight
  useEffect(() => {
    if (!canCheckout && items.length > 0) {
      router.replace("/cart");
    }
  }, [canCheckout, items.length, router]);

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
    details: string;
    postalCode: string;
    countryCode: string;
  }) => {
    if (!user?.id) return;
    setIsSavingAddress(true);
    setSaveAddressError(null);

    try {
      const supabase = createClient();
      const isFirst = addresses.length === 0;

      // Insert without .single() to avoid PGRST116 if RLS blocks the returning SELECT
      const { error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          full_address: data.address.trim(),
          details: data.details.trim(),
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
        // keep default fallback rate
      }
    };
    fetchExchangeRate();
  }, []);

  const currentAddress = addresses.find((a) => a.id === selectedAddress) || addresses[0];

  // Fetch FedEx shipping rate whenever address or weight changes
  const fetchShippingRate = useCallback(async (address: Address) => {
    setShippingLoading(true);
    setShippingError(null);
    setShippingCost(null);

    const postalCode = address.postal_code || "100-0001";
    const countryCode = address.country_code || "JP";

    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode, countryCode, totalWeightKg: totalWeight }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Shipping rate unavailable");
      }

      const data = await res.json();
      setShippingCost(data.shippingCost);
      setShippingName(data.serviceName ?? "Air Shipping");
      setShippingDelivery(data.estimatedDelivery ?? "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Shipping rate unavailable";
      setShippingError(msg);
    } finally {
      setShippingLoading(false);
    }
  }, [totalWeight]);

  useEffect(() => {
    if (currentAddress) {
      fetchShippingRate(currentAddress);
    }
  }, [currentAddress, fetchShippingRate]);

  // Handle address selection from modal — re-fetch shipping for new address
  const handleAddressSelect = useCallback((id: string) => {
    setSelectedAddress(id);
    // fetchShippingRate will be triggered by the currentAddress effect above
  }, []);

  const serviceFee = Math.round(totalPrice * 0.01);
  const grandTotal = totalPrice + (shippingCost ?? 0) + serviceFee;
  const grandTotalJpy = Math.round(grandTotal * exchangeRate);

  const handlePay = async () => {
    if (!currentAddress || !shippingCost) return;
    setIsProcessing(true);
    setPayError(null);

    try {
      const orderId = `ZB-${Date.now()}`;

      const res = await fetch("/api/midtrans/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          grossAmount: grandTotal,
          userId: user?.id,
          shippingCost,
          serviceFee,
          note,
          customerDetails: {
            first_name: currentAddress.name,
            phone: currentAddress.phone,
          },
          cartItems: items.map(({ product, qty }) => ({
            id: product.id,
            price: product.price_raw,
            qty,
            name: product.name,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error ?? "Failed to create payment");
      }

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

      window.snap!.pay(data.token, {
        onSuccess: () => {
          clearCart();
          router.push("/order-success");
        },
        onPending: () => {
          clearCart();
          router.push("/order-success");
        },
        onError: () => {
          setPayError("Payment failed. Please try again.");
          setIsProcessing(false);
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setPayError(msg);
      setIsProcessing(false);
    }
  };

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
              <p className="text-[14px] text-[#6b6b6b]">Loading addresses...</p>
            </div>
          ) : currentAddress ? (
            <div className="border border-[#511e0b] rounded-lg p-5 mt-3 relative bg-white">
              <p className="font-bold text-[16px] text-black">{currentAddress.name}</p>
              <p className="text-[14px] text-[#6b6b6b] mt-1">{currentAddress.phone}</p>
              <p className="text-[14px] text-[#6b6b6b]">{currentAddress.address}</p>
              <button
                onClick={() => setAddressModal(true)}
                className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
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
              <p className="text-[14px] text-[#6b6b6b]">Fetching shipping rate...</p>
            ) : shippingError ? (
              <p className="text-[14px] text-[#df0000]">{shippingError}</p>
            ) : shippingCost !== null ? (
              <>
                <p className="font-bold text-[15px] text-black">{shippingName}</p>
                <p className="text-[14px] text-[#6b6b6b] mt-1">{formatRp(shippingCost)}</p>
                {shippingDelivery && (
                  <p className="text-[14px] text-[#6b6b6b]">Estimated delivery: {shippingDelivery}</p>
                )}
              </>
            ) : (
              <p className="text-[14px] text-[#6b6b6b]">Select an address to see shipping rate.</p>
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
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Note</h2>
          <div className="border border-[#511e0b] rounded-lg p-4 mt-3 flex items-center bg-white">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="(Optional) Add a note for your order"
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
            {items.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-3">
                <div className="w-[72px] h-[72px] overflow-hidden shrink-0 rounded-md bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] text-black leading-snug line-clamp-2">{product.name}</p>
                  <p className="text-[13px] text-[#6b6b6b] mt-0.5">{product.price} × {qty}</p>
                  <p className="text-[13px] font-bold text-[#511e0b] mt-0.5">{formatRp(product.price_raw * qty)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between">
              <span className="text-[14px] text-black">Product subtotal</span>
              <span className="text-[14px] text-[#6b6b6b]">{formatRp(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-black">Air shipping</span>
              <span className="text-[14px] text-[#6b6b6b]">
                {shippingLoading
                  ? "Loading..."
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
              !shippingCost ||
              isProcessing
            }
            className="w-full bg-[#511e0b] text-white rounded-lg h-14 mt-6 font-bold text-[16px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Pay Now"}
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
        initialData={
          currentAddress
            ? {
                name: currentAddress.name,
                phone: currentAddress.phone,
                fullAddress: currentAddress.address,
                details: currentAddress.details || "",
                postalCode: currentAddress.postal_code || "",
                countryCode: currentAddress.country_code || "JP",
              }
            : { name: "", phone: "", fullAddress: "", details: "", postalCode: "", countryCode: "JP" }
        }
      />

      {/* Footer — desktop only */}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
