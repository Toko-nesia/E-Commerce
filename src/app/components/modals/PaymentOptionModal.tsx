"use client";

import { Modal } from "./Modal";
import { Building2 } from "lucide-react";
import type { MidtransPaymentType, PaymentMethod } from "@/types/database";

const paymentMethods: PaymentMethod[] = [
  { id: "bank_transfer", name: "Virtual Account", type: "bank_transfer", description: "Pay by bank virtual account through Midtrans" },
];

const PAYMENT_ICONS: Partial<Record<MidtransPaymentType, typeof Building2>> = {
  bank_transfer: Building2,
};

interface PaymentOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (id: string) => void;
}

export function PaymentOptionModal({ isOpen, onClose, selected, onSelect }: PaymentOptionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 pt-5">
        <h2 className="font-bold text-[18px] text-black text-center">Payment Method</h2>
        <p className="text-[13px] text-[#6b6b6b] text-center mt-1">
          Processed securely via Midtrans
        </p>
        <div className="mt-5 space-y-0">
          {paymentMethods.map((method, i) => {
            const Icon = PAYMENT_ICONS[method.type] ?? Building2;
            return (
              <div key={method.id}>
                <div
                  className="flex items-center py-4 cursor-pointer"
                  onClick={() => { onSelect(method.id); onClose(); }}
                >
                  <div className="bg-[#e0e0e0] border-[#511e0b] border border-solid rounded-lg w-[48px] h-[48px] flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-[#511e0b]" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-[14px] text-black font-medium">{method.name}</p>
                    {method.description && (
                      <p className="text-[12px] text-[#6b6b6b] mt-0.5">{method.description}</p>
                    )}
                  </div>
                  <div className="w-[20px] h-[20px] rounded-full border-2 border-black flex items-center justify-center shrink-0">
                    {selected === method.id && <div className="w-[10px] h-[10px] rounded-full bg-black" />}
                  </div>
                </div>
                {i < paymentMethods.length - 1 && <div className="h-px bg-[#511e0b] opacity-15" />}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-[#6b6b6b] text-center mt-4">
          Only Virtual Account is available for this checkout.
        </p>
      </div>
    </Modal>
  );
}
