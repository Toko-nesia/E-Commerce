"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Check, Edit3 } from "lucide-react";
import { PaymentOptionModal } from "../components/modals/PaymentOptionModal";
import { AddressModal } from "../components/modals/AddressModal";
import { EditAddressModal } from "../components/modals/EditAddressModal";
import { addresses } from "@/data/addresses";
import { paymentMethods } from "@/data/payment-methods";
import { useCart } from "@/contexts/cart-context";

function formatRp(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [paymentModal, setPaymentModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("bank_transfer");
  const [selectedAddress, setSelectedAddress] = useState("1");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const currentAddress = addresses.find((a) => a.id === selectedAddress) || addresses[0];

  const shipping = 350000;
  const serviceFee = 46000;
  const importTax = Math.round(totalPrice * 0.33);
  const grandTotal = totalPrice + shipping + serviceFee + importTax;
  // Approximate JPY (1 IDR ≈ 0.0093 JPY)
  const grandTotalJpy = Math.round(grandTotal * 0.0093);

  const handlePay = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 800));
    clearCart();
    router.push("/order-success");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f8f8]">
        <p className="text-[#6b6b6b] text-[16px]">Keranjang kamu kosong.</p>
        <Link href="/shop" className="text-[#511e0b] underline text-[15px]">
          Mulai belanja
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
          <h2 className="font-bold text-[22px] text-[#511e0b]">Alamat Pengiriman</h2>
          <div className="border border-[#511e0b] rounded-lg p-5 mt-3 relative bg-white">
            <p className="font-bold text-[16px] text-black">{currentAddress.name}</p>
            <p className="text-[14px] text-[#6b6b6b] mt-1">{currentAddress.phone}</p>
            <p className="text-[14px] text-[#6b6b6b]">{currentAddress.address}</p>            <button
              onClick={() => setAddressModal(true)}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
            >
              <Edit3 size={18} />
            </button>
          </div>

          {/* Shipping */}
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Pengiriman</h2>
          <div className="border border-[#511e0b] rounded-lg p-5 mt-3 bg-white">
            <p className="font-bold text-[15px] text-black">Air Shipping</p>
            <p className="text-[14px] text-[#6b6b6b] mt-1">{formatRp(shipping)}</p>
            <p className="text-[14px] text-[#6b6b6b]">Estimasi tiba Apr 12 - Jun 21</p>
          </div>

          {/* Payment */}
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Pembayaran</h2>
          <div className="border border-[#511e0b] rounded-lg p-5 mt-3 flex items-center relative bg-white">
            <div className="bg-[#e0e0e0] border-[#511e0b] border border-solid rounded-lg w-[80px] h-[48px] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-[#511e0b] text-center leading-tight px-1">
                {selectedPayment === "bank_transfer" ? "Bank\nTransfer" : "QRIS"}
              </span>
            </div>
            <p className="font-bold text-[15px] text-black ml-4">
              {paymentMethods.find(m => m.id === selectedPayment)?.name ?? selectedPayment}
            </p>
            <button
              onClick={() => setPaymentModal(true)}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
            >
              <Edit3 size={18} />
            </button>
          </div>

          {/* Note */}
          <h2 className="font-bold text-[22px] text-[#511e0b] mt-8">Catatan</h2>
          <div className="border border-[#511e0b] rounded-lg p-4 mt-3 flex items-center bg-white">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="(Opsional) Tambahkan catatan untuk pesananmu"
              className="text-[14px] text-[#6b6b6b] flex-1 bg-transparent border-none outline-none placeholder:text-[#999999]"
            />
            <Edit3 size={18} className="text-[#6b6b6b] shrink-0 ml-2" />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="w-full lg:w-[440px] bg-[#efefef] p-6 md:p-10 lg:min-h-[calc(100vh-80px)]">
          <h2 className="font-bold text-[22px] text-[#511e0b]">Pesanan</h2>

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
            {[
              ["Subtotal produk", formatRp(totalPrice)],
              ["Pengiriman udara", formatRp(shipping)],
              ["Biaya layanan", formatRp(serviceFee)],
              ["Pajak impor & bea cukai", formatRp(importTax)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[14px] text-black">{label}</span>
                <span className="text-[14px] text-[#6b6b6b]">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#df0000] mt-2">DDP (Delivered Duty Paid)</p>

          <div className="h-px bg-black/20 mt-6" />

          <div className="flex justify-between mt-4">
            <span className="font-bold text-[18px] text-black">Total Pembayaran</span>
            <span className="font-bold text-[18px] text-black">{formatRp(grandTotal)}</span>
          </div>
          <p className="font-bold text-[16px] text-[#df0000] text-right mt-1">
            ¥{grandTotalJpy.toLocaleString("ja-JP")}
          </p>

          <p className="text-[13px] text-[#df0000] mt-4">
            Pajak impor dihitung dalam IDR dan dikonversi ke JPY berdasarkan nilai tukar terkini.
          </p>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-[#511e0b] text-white rounded-lg h-14 mt-6 font-bold text-[16px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Memproses..." : "Bayar Sekarang"}
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
        onSelect={setSelectedAddress}
        onAddNew={() => { setAddressModal(false); setEditAddressModal(true); }}
      />
      <EditAddressModal
        isOpen={editAddressModal}
        onClose={() => setEditAddressModal(false)}
        onSave={() => {}}
        initialData={{ name: currentAddress.name, phone: currentAddress.phone, fullAddress: currentAddress.address, details: "" }}
      />
    </div>
  );
}
