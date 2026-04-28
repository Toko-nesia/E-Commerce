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
      <div className="p-6 pt-5">
        <h2 className="font-bold text-[18px] text-black text-center">Edit Address</h2>
        <div className="mt-5 space-y-4">
          <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Recipient Name</p>
            <input value={name} onChange={(e) => setName(e.target.value)} className="text-[14px] text-black w-full bg-transparent border-none outline-none" placeholder="Haruka" />
          </div>
          <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Phone Number</p>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="text-[14px] text-[#6b6b6b] w-full bg-transparent border-none outline-none" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="text-[14px] text-[#6b6b6b] w-full bg-transparent border-none outline-none" placeholder="Search your address" />
            </div>
            <p className="text-[12px] text-[#6b6b6b] mt-1">Example: street name / building / housing</p>
          </div>
          <div>
            <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
              <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} className="text-[14px] text-[#6b6b6b] w-full bg-transparent border-none outline-none" placeholder="Full Address" />
            </div>
            <p className="text-[12px] text-[#6b6b6b] mt-1">Make sure your address is correct, e.g. include housing name, apartment, or building</p>
          </div>
          <div>
            <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
              <input value={details} onChange={(e) => setDetails(e.target.value)} className="text-[14px] text-[#6b6b6b] w-full bg-transparent border-none outline-none" placeholder="Additional Details (Optional)" />
            </div>
            <p className="text-[12px] text-[#6b6b6b] mt-1">Example: block, unit number, or landmark</p>
          </div>
          <button onClick={() => { onSave({ name, phone, search, fullAddress, details }); onClose(); }} className="w-full bg-[#511e0b] text-white rounded-lg h-[46px] font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
            Save Address
          </button>
        </div>
      </div>
    </Modal>
  );
}
