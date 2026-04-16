"use client";

import { useState } from "react";
import { Modal } from "./Modal";

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; phone: string; search: string; fullAddress: string; details: string }) => void;
  initialData?: { name: string; phone: string; fullAddress: string; details: string };
}

export function EditAddressModal({ isOpen, onClose, onSave, initialData }: EditAddressModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [search, setSearch] = useState("");
  const [fullAddress, setFullAddress] = useState(initialData?.fullAddress || "");
  const [details, setDetails] = useState(initialData?.details || "");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 pt-7">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[32px] text-black text-center tracking-[-0.96px]">Edit Address</h2>
        <div className="mt-8 space-y-5">
          <div className="border border-black rounded-[8px] px-4 py-3">
            <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px]">Recipient Name</p>
            <input value={name} onChange={(e) => setName(e.target.value)} className="font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px] w-full bg-transparent border-none outline-none mt-1" placeholder="Haruka" />
          </div>
          <div className="border border-black rounded-[8px] px-4 py-4">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] w-full bg-transparent border-none outline-none" placeholder="Phone Number" />
          </div>
          <div>
            <div className="border border-black rounded-[8px] px-4 py-4">
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] w-full bg-transparent border-none outline-none" placeholder="Search your address" />
            </div>
            <p className="font-['Inter',sans-serif] text-[14px] text-[#a6a6a6] tracking-[-0.42px] mt-1.5">Example: street name / building / housing</p>
          </div>
          <div>
            <div className="border border-black rounded-[8px] px-4 py-4">
              <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] w-full bg-transparent border-none outline-none" placeholder="Full Address" />
            </div>
            <p className="font-['Inter',sans-serif] text-[14px] text-[#a6a6a6] tracking-[-0.42px] mt-1.5">Make sure your address is correct, e.g. include housing name, apartment, or building</p>
          </div>
          <div>
            <div className="border border-black rounded-[8px] px-4 py-4">
              <input value={details} onChange={(e) => setDetails(e.target.value)} className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] w-full bg-transparent border-none outline-none" placeholder="Additional Details (Optional)" />
            </div>
            <p className="font-['Inter',sans-serif] text-[14px] text-[#a6a6a6] tracking-[-0.42px] mt-1.5">Example: block, unit number, or landmark</p>
          </div>
          <button onClick={() => { onSave({ name, phone, search, fullAddress, details }); onClose(); }} className="w-full bg-[#511e0b] text-white rounded-[8px] h-[58px] font-['Inter:Bold',sans-serif] font-bold text-[20px] tracking-[-0.6px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
            Save Address
          </button>
        </div>
      </div>
    </Modal>
  );
}
