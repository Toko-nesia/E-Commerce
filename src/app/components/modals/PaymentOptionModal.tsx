"use client";

import { Modal } from "./Modal";
import { CreditCard, QrCode, Wallet, Building2 } from "lucide-react";
import type { MidtransPaymentType, PaymentMethod } from "@/types/database";

const paymentMethods: PaymentMethod[] = [
  { id: "bank_transfer", name: "Bank Transfer (BCA/BNI/Mandiri)", type: "bank_transfer", description: "Virtual account transfer" },
  { id: "qris", name: "QRIS", type: "qris", description: "Scan QR with any e-wallet" },
  { id: "credit_card", name: "Credit / Debit Card", type: "credit_card", description: "Visa, Mastercard, JCB" },
  { id: "gopay", name: "GoPay", type: "gopay", description: "Pay with GoPay balance" },
  { id: "shopeepay", name: "ShopeePay", type: "shopeepay", description: "Pay with ShopeePay" },
];

const PAYMENT_ICONS: Record<MidtransPaymentType, typeof CreditCard> = {
  bank_transfer: Building2,
  qris: QrCode,
  credit_card: CreditCard,
  gopay: Wallet,
  shopeepay: Wallet,
  cstore: Building2,
  echannel: Building2,
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
            const Icon = PAYMENT_ICONS[method.type] ?? Wallet;
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
          All payment methods are available when you click Pay Now.
        </p>
      </div>
    </Modal>
  );
}
