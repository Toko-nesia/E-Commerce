"use client";

import { useEffect } from "react";
import { CheckCircle, X, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface AddToCartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export function AddToCartPopup({ isOpen, onClose, productName }: AddToCartPopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] p-5 pointer-events-auto border border-gray-100 animate-[slideInUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-[#15a15b] shrink-0" />
            <p className="font-bold text-[15px] text-black">Berhasil ditambahkan!</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 transition-colors"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {productName && (
          <p className="text-[13px] text-gray-500 mb-4 line-clamp-2">{productName}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-[#511e0b] text-[#511e0b] rounded-lg py-2 text-[13px] font-medium hover:bg-[#faf5ee] transition-colors cursor-pointer bg-transparent"
          >
            Lanjut Belanja
          </button>
          <Link
            href="/cart"
            onClick={onClose}
            className="flex-1 bg-[#511e0b] text-white rounded-lg py-2 text-[13px] font-medium flex items-center justify-center gap-1.5 no-underline hover:bg-[#3d1608] transition-colors"
          >
            <ShoppingCart size={14} />
            Lihat Keranjang
          </Link>
        </div>
      </div>
    </div>
  );
}
