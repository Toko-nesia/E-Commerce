"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { paymentMethods } from "@/data/payment-methods";

interface PaymentOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (id: string) => void;
}

export function PaymentOptionModal({ isOpen, onClose, selected, onSelect }: PaymentOptionModalProps) {
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    onSelect(id);
    setActiveDetail(id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 pt-5">
        <h2 className="font-bold text-[18px] text-black text-center">Payment Option</h2>
        <div className="mt-6 space-y-0">
          {paymentMethods.map((method, i) => (
            <div key={method.id}>
              <div
                className="flex items-center py-4 cursor-pointer"
                onClick={() => handleSelect(method.id)}
              >
                <div className="bg-[#e0e0e0] border-[#511e0b] border border-solid rounded-lg w-[80px] h-[48px] flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-[#511e0b] text-center leading-tight px-1">
                    {method.type === "bank_transfer" ? "Bank\nTransfer" : "QRIS"}
                  </span>
                </div>
                <p className="text-[14px] text-black ml-4 flex-1">{method.name}</p>
                <div className="w-[20px] h-[20px] rounded-full border-2 border-black flex items-center justify-center">
                  {selected === method.id && <div className="w-[10px] h-[10px] rounded-full bg-black" />}
                </div>
              </div>

              {/* Bank Transfer details */}
              {method.type === "bank_transfer" && activeDetail === method.id && (
                <div className="mb-4 ml-[96px] bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-[13px] font-semibold text-black mb-2">Detail Rekening</p>
                  <div className="space-y-1 text-[13px] text-gray-700">
                    <div className="flex gap-2">
                      <span className="w-[100px] text-gray-500">Bank</span>
                      <span>: BCA</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[100px] text-gray-500">No. Rekening</span>
                      <span>: 1234567890</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[100px] text-gray-500">Atas Nama</span>
                      <span>: Tokonesia Indonesia</span>
                    </div>
                  </div>
                </div>
              )}

              {/* QRIS details */}
              {method.type === "qris" && activeDetail === method.id && (
                <div className="mb-4 ml-[96px] flex flex-col items-start gap-3">
                  <div className="w-[120px] h-[120px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-[13px] text-gray-500 font-medium">QR Code</span>
                  </div>
                  <p className="text-[12px] text-gray-600 max-w-[240px]">
                    Scan QR code menggunakan aplikasi dompet digital (GoPay, OVO, Dana, dll.)
                  </p>
                </div>
              )}

              {i < paymentMethods.length - 1 && <div className="h-px bg-[#511e0b] opacity-30" />}
            </div>
          ))}
        </div>

        <button
          className="mt-4 w-full bg-[#511e0b] text-white font-semibold py-3 rounded-lg text-[14px]"
          onClick={onClose}
        >
          Konfirmasi
        </button>
      </div>
    </Modal>
  );
}
