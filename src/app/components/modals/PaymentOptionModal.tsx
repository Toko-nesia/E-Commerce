import { useState } from "react";
import { Modal } from "./Modal";
import imgPaypal from "../../../imports/PaymentOption/a002559c80637287a6897bcbb94172adeaf103d3.png";
import imgSmiles from "../../../imports/PaymentOption/855f857e528c851d118dc36a29eb329315b97d1f.png";
import imgWise from "../../../imports/PaymentOption/ddb3a231b270e22da82487c5dc6ef2c14bdcd399.png";
import imgDcom from "../../../imports/PaymentOption/24f038a7942b396f3202d9ed0e43a8d2b600e5c8.png";

const paymentMethods = [
  { id: "paypal", name: "PayPal", img: imgPaypal, imgStyle: "h-[19px] w-[69px]", overflow: true, overflowStyle: "h-[183.93%] left-[-0.12%] top-[-41.96%] w-[100.24%]" },
  { id: "smiles", name: "Smiles", img: imgSmiles, imgStyle: "h-[20px] w-[74px]" },
  { id: "wise", name: "Wise", img: imgWise, imgStyle: "h-[16px] w-[63px]", overflow: true, overflowStyle: "h-[384.62%] left-0 top-[-144.23%] w-full" },
  { id: "dcom", name: "DCOM Money", img: imgDcom, imgStyle: "h-[17px] w-[73px]", overflow: true, overflowStyle: "h-[162.59%] left-[-5.47%] top-[-28.57%] w-[109.71%]" },
];

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
                  <div className={`relative overflow-hidden ${method.imgStyle}`}>
                    {method.overflow ? (
                      <img alt={method.name} className={`absolute max-w-none ${method.overflowStyle}`} src={method.img} />
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
