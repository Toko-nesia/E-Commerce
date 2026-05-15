"use client";

import { Modal } from "./Modal";
import { ChevronDown, MapPin } from "lucide-react";

interface ShippingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShippingDetailModal({ isOpen, onClose }: ShippingDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-[553px]">
      <div className="p-6 pt-5">
        <h2 className="font-bold text-[18px] text-black">Shipping Details</h2>

        <div className="border border-[#b0b0b0] rounded-lg mt-5 p-4">
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-[#6b6b6b]" />
            <p className="text-[14px] text-black">From Indonesia</p>
          </div>
          <div className="ml-[7px] h-[8px] border-l border-[#b0b0b0]" />
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-[#6b6b6b]" />
            <p className="text-[14px] text-black">Ship to your saved address</p>
            <ChevronDown size={14} className="text-[#6b6b6b]" />
          </div>
        </div>

        <p className="text-[13px] text-[#555] text-center mt-4">
          Product weight is calculated from live product data. Total shipping cost is calculated at checkout.
        </p>
        <p className="text-[13px] text-[#555] text-center mt-1">
          Shipping is available for orders of <span className="text-[#511e0b] font-medium">at least 21 kg</span>.
        </p>

        <div className="mt-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-bold text-[14px] text-black">Air Shipping</p>
              <p className="text-[13px] text-[#6b6b6b] mt-0.5">FedEx estimate is shown after you choose an address.</p>
            </div>
            <p className="font-bold text-[14px] text-black text-right">Calculated at checkout</p>
          </div>
          <div className="h-px bg-[#e0e0e0] mt-4" />
        </div>
      </div>
    </Modal>
  );
}

