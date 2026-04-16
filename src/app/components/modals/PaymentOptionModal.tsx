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
      <div className="p-8 pt-7">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[32px] text-black text-center tracking-[-0.96px]">Payment Option</h2>
        <div className="mt-10 space-y-0">
          {paymentMethods.map((method, i) => (
            <div key={method.id}>
              <div className="flex items-center py-5 cursor-pointer" onClick={() => { onSelect(method.id); onClose(); }}>
                <div className="bg-[#ececec] border-[#511e0b] border-[0.5px] border-solid rounded-[8px] w-[91px] h-[57px] flex items-center justify-center shrink-0">
                  <div className={`relative overflow-hidden ${method.img_style}`}>
                    {method.overflow ? (
                      <img alt={method.name} className={`absolute max-w-none ${method.overflow_style}`} src={method.img} />
                    ) : (
                      <img alt={method.name} className="w-full h-full object-cover" src={method.img} />
                    )}
                  </div>
                </div>
                <p className="font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] ml-6 flex-1">{method.name}</p>
                <div className="w-[30px] h-[30px] rounded-full border-[3.5px] border-black flex items-center justify-center">
                  {selected === method.id && <div className="w-[14px] h-[14px] rounded-full bg-black" />}
                </div>
              </div>
              {i < paymentMethods.length - 1 && <div className="h-px bg-[#511e0b] opacity-50" />}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
