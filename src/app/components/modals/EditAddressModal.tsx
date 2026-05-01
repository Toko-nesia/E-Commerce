"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    address: string;
    details: string;
    postalCode: string;
    countryCode: string;
  }) => void | Promise<void>;
  initialData?: {
    name: string;
    phone: string;
    fullAddress: string;
    details: string;
    postalCode?: string;
    countryCode?: string;
  };
  isSaving?: boolean;
  saveError?: string | null;
}

export function EditAddressModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving = false,
  saveError = null,
}: EditAddressModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.fullAddress || "");
  const [details, setDetails] = useState(initialData?.details || "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || "");
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || "JP");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setPhone(initialData?.phone || "");
      setAddress(initialData?.fullAddress || "");
      setDetails(initialData?.details || "");
      setPostalCode(initialData?.postalCode || "");
      setCountryCode(initialData?.countryCode || "JP");
      setValidationError(null);
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim() || !address.trim() || !postalCode.trim()) {
      setValidationError("Please fill out all required fields (Name, Address, Postal Code).");
      return;
    }
    setValidationError(null);
    onSave({ name, phone, address, details, postalCode, countryCode });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 pt-5 max-h-[85vh] overflow-y-auto">
        <h2 className="font-bold text-[18px] text-black text-center">Add Address</h2>
        <div className="mt-5 space-y-4">
          <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Recipient Name <span className="text-[#df0000]">*</span></p>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setValidationError(null); }}
              className="text-[14px] text-black w-full bg-transparent border-none outline-none"
              placeholder="Haruka Yamamoto"
            />
          </div>

          <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Phone Number</p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-[14px] text-black w-full bg-transparent border-none outline-none"
              placeholder="+81 90-1234-5678"
            />
          </div>

          <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Full Address <span className="text-[#df0000]">*</span></p>
            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); setValidationError(null); }}
              className="text-[14px] text-black w-full bg-transparent border-none outline-none resize-none h-[60px]"
              placeholder="1-2-3 Shibuya, Shibuya-ku, Tokyo"
            />
          </div>

          <div className="border border-[#b0b0b0] rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Additional Details (Optional)</p>
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="text-[14px] text-black w-full bg-transparent border-none outline-none"
              placeholder="Apartment name, floor, etc."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 border border-[#b0b0b0] rounded-lg px-4 py-3">
              <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Postal Code <span className="text-[#df0000]">*</span></p>
              <input
                value={postalCode}
                onChange={(e) => { setPostalCode(e.target.value); setValidationError(null); }}
                className="text-[14px] text-black w-full bg-transparent border-none outline-none"
                placeholder="100-0001"
              />
            </div>
            <div className="w-[100px] border border-[#b0b0b0] rounded-lg px-4 py-3">
              <p className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-1">Country</p>
              <input
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                maxLength={2}
                className="text-[14px] text-black w-full bg-transparent border-none outline-none uppercase"
                placeholder="JP"
              />
            </div>
          </div>
          <p className="text-[12px] text-[#6b6b6b] -mt-2">
            Postal code is required for shipping rate calculation
          </p>

          {validationError && (
            <p className="text-[13px] text-[#df0000] text-center font-medium">{validationError}</p>
          )}
          {saveError && (
            <p className="text-[13px] text-[#df0000] text-center">{saveError}</p>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#511e0b] text-white rounded-lg h-[46px] font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
