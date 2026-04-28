"use client";

import { Modal } from "./Modal";
import { Plus } from "lucide-react";
import type { Address } from "@/types/database";

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
      <div className="p-6 pt-5">
        <h2 className="font-bold text-[18px] text-black text-center">Address</h2>
        <div className="mt-5 space-y-0">
          {addresses.map((addr) => (
            <div key={addr.id}>
              <div className="flex items-start py-4 cursor-pointer" onClick={() => { onSelect(addr.id); onClose(); }}>
                <div className="flex-1">
                  <p className="font-bold text-[15px] text-black">{addr.name}</p>
                  <p className="text-[13px] text-[#6b6b6b] mt-0.5">{addr.phone}</p>
                  <p className="text-[13px] text-[#6b6b6b] mt-0.5">{addr.address}</p>
                </div>
                <div className="w-[20px] h-[20px] rounded-full border-2 border-black flex items-center justify-center shrink-0 mt-1">
                  {selectedId === addr.id && <div className="w-[10px] h-[10px] rounded-full bg-black" />}
                </div>
              </div>
              <div className="h-px bg-[#511e0b] opacity-30" />
            </div>
          ))}
        </div>
        <button onClick={onAddNew} className="w-full bg-[#511e0b] text-white rounded-lg h-[46px] mt-5 font-bold text-[14px] border-none cursor-pointer flex items-center justify-center gap-2 hover:bg-[#3d1608] transition-colors">
          <Plus size={16} /> Add Address
        </button>
      </div>
    </Modal>
  );
}
