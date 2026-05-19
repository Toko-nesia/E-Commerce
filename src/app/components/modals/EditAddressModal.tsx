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
    label: string;
    postalCode: string;
    countryCode: string;
  }) => void | Promise<void>;
  initialData?: {
    name: string;
    phone: string;
    fullAddress: string;
    label: string;
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
  const [label, setLabel] = useState(initialData?.label || "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || "");
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || "JP");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setPhone(initialData?.phone || "");
      setAddress(initialData?.fullAddress || "");
      setLabel(initialData?.label || "");
      setPostalCode(initialData?.postalCode || "");
      setCountryCode(initialData?.countryCode || "JP");
      setValidationError(null);
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setValidationError("Please fill out all required fields (Name, Phone, Address).");
      return;
    }
    setValidationError(null);
    onSave({ name, phone, address, label, postalCode, countryCode });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 max-h-[85vh] overflow-y-auto">
        <h2 className="font-bold text-[18px] text-black text-center mb-5">Add Address</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-black mb-1.5">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => { setLabel(e.target.value); setValidationError(null); }}
              placeholder="e.g. HOME, OFFICE"
              className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-black mb-1.5">Recipient Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setValidationError(null); }}
              placeholder="Full name"
              className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-black mb-1.5">Phone *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setValidationError(null); }}
              placeholder="e.g. +81 90-1234-5678"
              className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-black mb-1.5">Address *</label>
            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); setValidationError(null); }}
              placeholder="Full street address"
              rows={2}
              className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => { setPostalCode(e.target.value); setValidationError(null); }}
                placeholder="e.g. 107-8420"
                className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Country Code</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                placeholder="JP"
                className="w-full border border-[#b0b0b0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#511e0b] uppercase"
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
            className="w-full bg-[#511e0b] text-white rounded-lg h-12 mt-2 font-bold text-[14px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
