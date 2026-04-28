"use client";

import { Modal } from "./Modal";
import { paymentMethods } from "@/data/payment-methods";

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
        <h2 className="font-bold text-[18px] text-black text-center">Payment Option</h2>
        <div className="mt-6 space-y-0">
          {paymentMethods.map((method, i) => (
            <div key={method.id}>
              <div className="flex items-center py-4 cursor-pointer" onClick={() => { onSelect(method.id); onClose(); }}>
                <div className="bg-[#e0e0e0] border-[#511e0b] border border-solid rounded-lg w-[80px] h-[48px] flex items-center justify-center shrink-0">
                  <div className={`relative overflow-hidden ${method.img_style}`}>
                    {method.overflow ? (
                      <img alt={method.name} className={`absolute max-w-none ${method.overflow_style}`} src={method.img} />
                    ) : (
                      <img alt={method.name} className="w-full h-full object-cover" src={method.img} />
                    )}
                  </div>
                </div>
                <p className="text-[14px] text-black ml-4 flex-1">{method.name}</p>
                <div className="w-[20px] h-[20px] rounded-full border-2 border-black flex items-center justify-center">
                  {selected === method.id && <div className="w-[10px] h-[10px] rounded-full bg-black" />}
                </div>
              </div>
              {i < paymentMethods.length - 1 && <div className="h-px bg-[#511e0b] opacity-30" />}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
