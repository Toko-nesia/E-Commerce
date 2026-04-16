import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Check, Edit3 } from "lucide-react";
import { PaymentOptionModal } from "../modals/PaymentOptionModal";
import { AddressModal } from "../modals/AddressModal";
import { EditAddressModal } from "../modals/EditAddressModal";
import imgImage18 from "../../../imports/CheckOutPage/c08f2321d986609404c2bdb84a34d05860464a4c.png";
import imgPaypal from "../../../imports/CheckOutPage/a002559c80637287a6897bcbb94172adeaf103d3.png";

const addresses = [
  { id: "1", name: "Haruka", phone: "+81 476 22-2311", address: "1-10-5 Akasaka, Minato-ku, Tokyo 107-8420" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [paymentModal, setPaymentModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("paypal");
  const [selectedAddress, setSelectedAddress] = useState("1");
  const [note, setNote] = useState("");

  const currentAddress = addresses.find(a => a.id === selectedAddress) || addresses[0];

  return (
    <div className="bg-[#f8f8f8] min-h-screen">
      {/* Header */}
      <header className="bg-white h-24 flex items-center px-8 md:px-16 justify-between sticky top-0 z-40 w-full">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px] no-underline">LOREM IPSUM</Link>
          <div className="w-px h-[22px] bg-[#ba2f2f] rotate-0" />
          <span className="font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px]">Checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Shield size={24} className="text-[#15a15b]" />
            <Check size={10} className="text-[#15a15b] absolute top-[7px] left-[7px]" />
          </div>
          <div>
            <p className="font-['Inter',sans-serif] text-[16px] text-black tracking-[-0.48px]">Shop Protection</p>
            <p className="font-['Inter',sans-serif] text-[12px] text-[#a6a6a6] tracking-[-0.36px]">Your purchase is secure and protected</p>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1200px] mx-auto">
        {/* Left Column */}
        <div className="flex-1 p-10 pr-16">
          {/* Address */}
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px]">Address</h2>
          <div className="border border-[#511e0b] rounded-[8px] p-5 mt-4 relative">
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px]">{currentAddress.name}</p>
            <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] mt-1">{currentAddress.phone}</p>
            <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px]">{currentAddress.address}</p>
            <button onClick={() => setAddressModal(true)} className="absolute top-5 right-5 bg-transparent border-none cursor-pointer p-0">
              <Edit3 size={20} />
            </button>
          </div>

          {/* Shipping */}
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px] mt-10">Shipping</h2>
          <div className="border border-[#511e0b] rounded-[8px] p-5 mt-4">
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px]">Air Shipping</p>
            <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] mt-1">Rp350.000</p>
            <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px]">Estimated arrival Apr 12 - June 21</p>
          </div>

          {/* Payment */}
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px] mt-10">Payment</h2>
          <div className="border border-[#511e0b] rounded-[8px] p-5 mt-4 flex items-center relative">
            <div className="bg-[#ececec] border-[#511e0b] border-[0.5px] border-solid rounded-[8px] w-[91px] h-[57px] flex items-center justify-center">
              <div className="relative overflow-hidden h-[19px] w-[69px]">
                <img alt="PayPal" className="absolute h-[183.93%] left-[-0.12%] max-w-none top-[-41.96%] w-[100.24%]" src={imgPaypal} />
              </div>
            </div>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px] ml-6">PayPal</p>
            <button onClick={() => setPaymentModal(true)} className="absolute top-5 right-5 bg-transparent border-none cursor-pointer p-0">
              <Edit3 size={20} />
            </button>
          </div>

          {/* Note */}
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px] mt-10">Note</h2>
          <div className="border border-[#511e0b] rounded-[8px] p-4 mt-4 flex items-center relative">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="(Optional) Add a message for your order"
              className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] flex-1 bg-transparent border-none outline-none"
            />
            <Edit3 size={20} className="text-black shrink-0 ml-2" />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="w-[500px] bg-[#ececec] p-10 min-h-[calc(100vh-96px)]">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] text-[#511e0b] tracking-[-0.9px]">Order</h2>

          <div className="flex gap-4 mt-6">
            <div className="w-[108px] h-[108px] overflow-hidden shrink-0">
              <img alt="Product" className="w-full h-full object-cover" src={imgImage18} />
            </div>
            <div>
              <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black tracking-[-0.6px]">Cosmos Kipas Angin Wall Fan 16-WFGR</p>
              <p className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] mt-1">Rp397.700</p>
            </div>
          </div>

          <div className="mt-10 space-y-1">
            {[
              ["Total item", "2"],
              ["Order Subtotal", "Rp795.400"],
              ["Shipping Subtotal", "Rp350.000"],
              ["Service Fee", "Rp46.000"],
              ["Import Tax & Duties", "Rp268.600"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="font-['Inter',sans-serif] text-[20px] text-black tracking-[-0.6px]">{label}</span>
                <span className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px]">{value}</span>
              </div>
            ))}
          </div>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#df0000] tracking-[-0.45px] mt-2">DDP (Delivered Duty Paid)</p>

          <div className="h-px bg-black mt-8" />

          <div className="flex justify-between mt-4">
            <span className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-black tracking-[-0.72px]">Total Payment</span>
            <span className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-black tracking-[-0.72px]">Rp1.460.000</span>
          </div>
          <p className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-[#df0000] tracking-[-0.72px] text-right">¥13.535,21</p>

          <p className="font-['Inter',sans-serif] text-[15px] text-[#df0000] tracking-[-0.45px] mt-6">
            Import duties and taxes are calculated in IDR and converted to JPY based on the latest exchange rate
          </p>

          <button onClick={() => navigate("/")} className="w-full bg-[#511e0b] text-white rounded-[8px] h-[58px] mt-6 font-['Inter:Bold',sans-serif] font-bold text-[20px] tracking-[-0.6px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
            Pay Now
          </button>
        </div>
      </div>

      {/* Modals */}
      <PaymentOptionModal isOpen={paymentModal} onClose={() => setPaymentModal(false)} selected={selectedPayment} onSelect={setSelectedPayment} />
      <AddressModal isOpen={addressModal} onClose={() => setAddressModal(false)} addresses={addresses} selectedId={selectedAddress} onSelect={setSelectedAddress} onAddNew={() => { setAddressModal(false); setEditAddressModal(true); }} />
      <EditAddressModal isOpen={editAddressModal} onClose={() => setEditAddressModal(false)} onSave={() => {}} initialData={{ name: "Haruka", phone: "+81 476 22-2311", fullAddress: "1-10-5 Akasaka, Minato-ku, Tokyo 107-8420", details: "" }} />
    </div>
  );
}
