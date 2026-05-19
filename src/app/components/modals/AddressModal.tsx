"use client";

import { Modal } from "./Modal";
import { Plus, Phone } from "lucide-react";
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
      <div className="p-6 pt-5 max-h-[85vh] overflow-y-auto">
        <h2 className="font-bold text-[18px] text-black text-center mb-5">Select Address</h2>
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => { onSelect(addr.id); onClose(); }}
              className={`border rounded-xl p-4 relative cursor-pointer hover:bg-gray-50 transition-colors ${selectedId === addr.id ? "border-[#511e0b] bg-[#fdf9f5]" : "border-[#b0b0b0]"}`}
            >
              <div className="flex items-center gap-2 mb-2 pr-8">
                {addr.label && (
                  <span className="bg-[#511e0b] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{addr.label}</span>
                )}
                {addr.is_default && (
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">DEFAULT</span>
                )}
              </div>
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="font-medium text-[15px] text-black">{addr.name}</p>
                  <p className="text-[13px] text-[#6b6b6b] mt-0.5 leading-relaxed">{addr.address}</p>
                  {addr.postal_code && (
                    <p className="text-[12px] text-[#6b6b6b] mt-0.5">{addr.postal_code}, {addr.country_code || "JP"}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Phone size={11} className="text-[#6b6b6b]" />
                    <span className="text-[13px] text-[#6b6b6b]">{addr.phone}</span>
                  </div>
                </div>
                <div className="w-[20px] h-[20px] rounded-full border-2 border-[#511e0b] flex items-center justify-center shrink-0 mt-1 ml-3">
                  {selectedId === addr.id && <div className="w-[10px] h-[10px] rounded-full bg-[#511e0b]" />}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onAddNew} className="w-full bg-white border border-[#511e0b] text-[#511e0b] rounded-lg h-[46px] mt-5 font-bold text-[14px] cursor-pointer flex items-center justify-center gap-2 hover:bg-[#fdf9f5] transition-colors">
          <Plus size={16} /> Add New Address
        </button>
      </div>
    </Modal>
  );
}
