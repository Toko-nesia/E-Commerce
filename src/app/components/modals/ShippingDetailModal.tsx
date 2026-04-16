import { Modal } from "./Modal";
import { MapPin, ChevronDown } from "lucide-react";

interface ShippingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShippingDetailModal({ isOpen, onClose }: ShippingDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-[553px]">
      <div className="p-8 pt-7">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[32px] text-black tracking-[-0.96px]">Shipping Details</h2>

        <div className="border border-[#a6a6a6] rounded-[5px] mt-8 p-6">
          <div className="flex items-center gap-3">
            <MapPin size={20} />
            <p className="font-['Inter',sans-serif] text-[15px] text-black tracking-[-0.45px]">From Solo, Indonesia</p>
          </div>
          <div className="ml-[10px] h-[9px] border-l border-[#7f7f7f]" />
          <div className="flex items-center gap-3">
            <MapPin size={20} />
            <p className="font-['Inter',sans-serif] text-[15px] text-black tracking-[-0.45px]">Ship to Tokyo, Japan</p>
            <ChevronDown size={16} />
          </div>
        </div>

        <p className="font-['Inter',sans-serif] text-[15px] text-black tracking-[-0.45px] text-center mt-6">
          Weight per item: 500g <span className="font-bold">•</span> Total shipping cost calculated at checkout
        </p>
        <p className="font-['Inter',sans-serif] text-[15px] text-black tracking-[-0.45px] text-center mt-1">
          Shipping is available for orders of <span className="text-[#511e0b]">at least 21 kg</span>.
        </p>

        <div className="mt-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-black tracking-[-0.45px]">Air Shipping</p>
              <p className="font-['Inter',sans-serif] text-[15px] text-[#a6a6a6] tracking-[-0.45px] mt-1">Estimated arrival Apr 12 - June 21</p>
            </div>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-black tracking-[-0.45px]">Rp350.000</p>
          </div>
          <div className="h-px bg-[#a6a6a6] mt-4" />
        </div>
      </div>
    </Modal>
  );
}
