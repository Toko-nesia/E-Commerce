"use client";

import { use, useState } from "react";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { Truck, MapPin, Box, ChevronRight, Minus, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AddToCartPopup } from "../../components/modals/AddToCartPopup";
import { ShippingDetailModal } from "../../components/modals/ShippingDetailModal";
import { getProductById } from "@/data/products";
import { useCart } from "@/contexts/cart-context";
import type { Product } from "@/types/database";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);

  const productData = getProductById(parseInt(id));

  if (!productData) {
    return (
      <PageWrapper>
        <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
          <p className="text-2xl font-bold text-[#511e0b] mb-4">Produk tidak ditemukan</p>
          <Link href="/shop" className="text-[#511e0b] underline text-[15px]">
            ← Kembali ke toko
          </Link>
        </div>
      </PageWrapper>
    );
  }

  // productData may be a detailed product or basic Product — handle both
  const product = productData as {
    id: number;
    name: string;
    category: string;
    price: string;
    price_raw: number;
    image: string;
    stock: number;
    specifications?: [string, string][];
    description?: { text: string; features: string[] };
    shipping?: { origin: string; minWeight: string; airPrice: string; estimatedDelivery: string };
  };

  const specifications = product.specifications ?? [
    ["Stok", String(product.stock)],
    ["Kondisi", "New"],
  ];

  const description = product.description ?? {
    text: "Produk berkualitas dari Indonesia.",
    features: [],
  };

  const shipping = product.shipping ?? {
    origin: "Indonesia",
    minWeight: "5 kg",
    airPrice: "Rp350.000",
    estimatedDelivery: "Apr 12 - June 21",
  };

  const handleAddToCart = () => {
    const cartProduct: Product = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      price_raw: product.price_raw,
      badge: "",
      badge_color: "bg-white",
      image: product.image,
      stock: product.stock,
    };
    addToCart(cartProduct, qty);
    setShowCartPopup(true);
  };

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8">
        {/* Breadcrumb */}
        <Link href="/shop" className="inline-flex items-center gap-1 text-[13px] text-[#a6a6a6] hover:text-[#511e0b] transition-colors no-underline mb-6">
          <ArrowLeft size={14} />
          Kembali ke toko
        </Link>

        {/* Product Top */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="w-full md:w-[380px] md:h-[380px] h-[280px] overflow-hidden shrink-0 rounded-lg bg-[#f8f8f8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
          </div>

          <div className="flex-1">
            <p className="text-[13px] text-[#511e0b] font-medium uppercase tracking-wider">{product.category}</p>
            <h1 className="font-bold text-[24px] md:text-[28px] text-[#511e0b] tracking-tight mt-1 leading-snug">{product.name}</h1>
            <p className="font-bold text-[26px] text-[#eb0d0d] mt-2">{product.price}</p>

            {/* Stock info */}
            <p className="text-[13px] text-[#a6a6a6] mt-1">
              Stok: <span className="text-[#511e0b] font-medium">{product.stock}</span>
            </p>

            {/* Shipping info */}
            <div className="mt-5 flex items-start gap-2">
              <Truck size={18} className="text-[#15A15B] mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] text-[#511e0b] font-medium">Estimasi tiba: {shipping.estimatedDelivery}</p>
                <p className="text-[12px] text-[#a6a6a6] mt-0.5">Minimum berat {shipping.minWeight} per pengiriman</p>
              </div>
              <button
                onClick={() => setShowShippingModal(true)}
                className="text-[#a6a6a6] bg-transparent border-none cursor-pointer p-0 ml-1"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-3 mt-8">
              <div className="border border-[#511e0b] rounded-md flex items-center h-10 w-32 justify-between px-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
                  aria-label="Kurangi"
                >
                  <Minus size={14} />
                </button>
                <span className="text-[14px] text-[#511e0b] font-medium">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
                  aria-label="Tambah"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 md:flex-none bg-[#511e0b] text-white rounded-md h-10 px-6 text-[14px] font-medium border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? "Stok Habis" : "Tambah ke Keranjang"}
              </button>
            </div>
          </div>
        </div>

        {/* Specification */}
        <div className="mt-12 border-t border-[#ececec] pt-8">
          <h2 className="font-bold text-[18px] text-[#511e0b]">Spesifikasi Produk</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            {specifications.map(([label, value]) => (
              <div key={label} className="flex gap-4 py-2 border-b border-[#f0f0f0]">
                <span className="text-[14px] text-[#a6a6a6] w-[140px] shrink-0">{label}</span>
                <span className="text-[14px] text-[#511e0b] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-10">
          <h2 className="font-bold text-[18px] text-[#511e0b]">Deskripsi Produk</h2>
          <div className="text-[14px] text-gray-700 mt-4 leading-relaxed">
            <p>{description.text}</p>
            {description.features.length > 0 && (
              <ul className="list-disc ml-5 mt-3 space-y-1.5">
                {description.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Shipping Detail */}
        <div className="mt-10 border-t border-[#ececec] pt-8">
          <h2 className="font-bold text-[18px] text-[#511e0b]">Detail Pengiriman</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[#a6a6a6] mt-0.5 shrink-0" />
              <p className="text-[14px] text-gray-700">Dikirim dari <span className="font-medium text-[#511e0b]">{shipping.origin}</span></p>
            </div>
            <div className="flex items-start gap-3">
              <Box size={18} className="text-[#a6a6a6] mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] text-gray-700">Minimum <span className="font-medium">{shipping.minWeight}</span> per pengiriman</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck size={18} className="text-[#a6a6a6] mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] text-gray-700">Biaya pengiriman udara: <span className="font-medium text-[#511e0b]">{shipping.airPrice}</span></p>
                <p className="text-[12px] text-[#a6a6a6] mt-0.5">Estimasi tiba: {shipping.estimatedDelivery}</p>
              </div>
            </div>
            <button
              className="text-[14px] font-bold text-[#fbbe48] hover:text-[#e0a820] transition-colors cursor-pointer bg-transparent border-none p-0"
              onClick={() => setShowShippingModal(true)}
            >
              Lihat detail pengiriman →
            </button>
          </div>
        </div>
      </div>

      <AddToCartPopup
        isOpen={showCartPopup}
        onClose={() => setShowCartPopup(false)}
        productName={product.name}
      />
      <ShippingDetailModal isOpen={showShippingModal} onClose={() => setShowShippingModal(false)} />
    </PageWrapper>
  );
}
