"use client";

import { use, useState } from "react";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { Truck, MapPin, Box, ChevronRight, Minus, Plus } from "lucide-react";
import { AddToCartPopup } from "../../components/modals/AddToCartPopup";
import { ShippingDetailModal } from "../../components/modals/ShippingDetailModal";
import { productDetail } from "@/data/products";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [qty, setQty] = useState(1);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Future: fetch product by id from Supabase
  const product = productDetail;

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* Product Top */}
        <div className="flex gap-12">
          <div className="w-[400px] h-[400px] overflow-hidden shrink-0">
            <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
          </div>
          <div className="flex-1">
            <p className="font-['Inter',sans-serif] text-[20px] text-[#511e0b] tracking-[-0.6px]">{product.category}</p>
            <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[32px] text-[#511e0b] tracking-[-0.96px] mt-1">{product.name}</h1>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[32px] text-[#eb0d0d] tracking-[-0.96px] mt-2">{product.price}</p>

            <div className="mt-6 flex items-center gap-2">
              <p className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#511e0b] tracking-[-0.48px]">Shipping</p>
              <div className="flex items-center gap-2 ml-4">
                <Truck size={20} className="text-[#15A15B]" />
                <div>
                  <p className="font-['Inter',sans-serif] text-[16px] text-[#511e0b] tracking-[-0.48px]">Estimated delivery: {product.shipping.estimatedDelivery}</p>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#a6a6a6] tracking-[-0.36px]">Shipping is available for orders of at least {product.shipping.minWeight}.</p>
                </div>
                <ChevronRight size={20} className="text-[#a6a6a6]" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <div className="border border-[#511e0b] rounded-[3px] flex items-center h-[33px] w-[141px] justify-between px-4">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="bg-transparent border-none cursor-pointer p-0"><Minus size={16} /></button>
                <span className="font-['Inter',sans-serif] text-[14px] text-[#511e0b]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="bg-transparent border-none cursor-pointer p-0"><Plus size={13} /></button>
              </div>
              <button onClick={() => setShowCartPopup(true)} className="bg-[#511e0b] text-white rounded-[3px] h-[33px] px-6 font-['Inter',sans-serif] text-[14px] tracking-[-0.42px] border-none cursor-pointer hover:bg-[#3d1608] transition-colors">
                Add to cart
              </button>
            </div>
          </div>
        </div>

        {/* Specification */}
        <div className="mt-12">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#511e0b] tracking-[-0.6px]">Spesification Product</h2>
          <div className="mt-4 space-y-1">
            {product.specifications.map(([label, value]) => (
              <div key={label} className="flex gap-8">
                <span className="font-['Inter',sans-serif] text-[20px] text-[#a6a6a6] tracking-[-0.6px] w-[180px]">{label}</span>
                <span className="font-['Inter',sans-serif] text-[20px] text-[#511e0b] tracking-[-0.6px]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-12">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#511e0b] tracking-[-0.6px]">Description Product</h2>
          <div className="font-['Inter',sans-serif] text-[20px] text-[#511e0b] tracking-[-0.6px] mt-4 text-justify">
            <p>{product.description.text}</p>
            <ul className="list-disc ml-8 mt-2 space-y-1">
              {product.description.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Shipping Detail */}
        <div className="mt-12">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#511e0b] tracking-[-0.6px]">Detail Shipping</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-[#a6a6a6] mt-1" />
              <p className="font-['Inter',sans-serif] text-[20px] text-[#511e0b] tracking-[-0.6px]">Ships from {product.shipping.origin}</p>
            </div>
            <div className="flex items-start gap-3">
              <Box size={20} className="text-[#a6a6a6] mt-1" />
              <div>
                <p className="font-['Inter',sans-serif] text-[20px] text-[#511e0b] tracking-[-0.6px]">Minimum {product.shipping.minWeight} per shipment</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#511e0b] tracking-[-0.36px]">Shipping is available for orders of at least {product.shipping.minWeight}.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck size={20} className="text-[#a6a6a6] mt-1" />
              <div>
                <p className="font-['Inter',sans-serif] text-[20px] text-[#511e0b] tracking-[-0.6px]">Air shipping fee: {product.shipping.airPrice}</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#511e0b] tracking-[-0.36px]">Estimated delivery: {product.shipping.estimatedDelivery}</p>
              </div>
            </div>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#fbbe48] tracking-[-0.6px] cursor-pointer" onClick={() => setShowShippingModal(true)}>See shipping details</p>
          </div>
        </div>
      </div>
      <AddToCartPopup isOpen={showCartPopup} onClose={() => setShowCartPopup(false)} />
      <ShippingDetailModal isOpen={showShippingModal} onClose={() => setShowShippingModal(false)} />
    </PageWrapper>
  );
}
