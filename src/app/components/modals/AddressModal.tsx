import { useState } from "react";
import { Modal } from "./Modal";
import { Plus } from "lucide-react";

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export function AddressModal({ isOpen, onClose, addresses, selectedId, onSelect, onAddNew }: AddressModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 pt-7">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[32px] text-black text-center tracking-[-0.96px]">Address</h2>
        <div className="mt-8 space-y-0">
          {addresses.map((addr, i) => (
            <div key={addr.id}>
              <div className="flex items-start py-5 cursor-pointer" onClick={() => { onSelect(addr.id); onClose(); }}>
                <div className="flex-1">
                  <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px]">{addr.name}</p>
                  <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] mt-1">{addr.phone}</p>
                  <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] mt-0.5">{addr.address}</p>
                </div>
                <div className="w-[30px] h-[30px] rounded-full border-[3.5px] border-black flex items-center justify-center shrink-0 mt-1">
                  {selectedId === addr.id && <div className="w-[14px] h-[14px] rounded-full bg-black" />}
                </div>
              </div>
              <div className="h-px bg-[#511e0b] opacity-50" />
            </div>
          ))}
        </div>
        <button onClick={onAddNew} className="w-full bg-[#511e0b] text-white rounded-[8px] h-[58px] mt-6 font-['Inter:Bold',sans-serif] font-bold text-[20px] tracking-[-0.6px] border-none cursor-pointer flex items-center justify-center gap-2 hover:bg-[#3d1608] transition-colors">
          <Plus size={24} /> Add Address
        </button>
      </div>
    </Modal>
  );
}
