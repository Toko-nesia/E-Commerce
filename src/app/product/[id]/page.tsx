"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Box, ChevronRight, MapPin, Minus, Plus, Truck } from "lucide-react";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { AddToCartPopup } from "../../components/modals/AddToCartPopup";
import { ShippingDetailModal } from "../../components/modals/ShippingDetailModal";
import { createClient } from "@/lib/supabase/client";
import { resolveImagePath } from "@/lib/image-paths";
import { useCart } from "@/contexts/cart-context";
import { formatJpyFromIdr } from "@/domain/formatters";
import type { Product, ProductVariant } from "@/types/database";

function normalizeSpec([label, value]: [string, string]): [string, string] {
  const labels: Record<string, string> = {
    Stok: "Stock",
    Kondisi: "Condition",
    Berat: "Weight",
    Asal: "Origin",
  };
  const values: Record<string, string> = {
    Baru: "New",
  };
  return [labels[label] ?? label, values[value] ?? value];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [customAmountRaw, setCustomAmountRaw] = useState(500_000);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from("products")
          .select("*")
          .eq("id", Number(id))
          .single();

        if (queryError) throw new Error(queryError.message);
        if (!data) throw new Error("Product not found");

        setProduct(data as Product);
        const { data: variantRows, error: variantError } = await (supabase as any)
          .from("product_variants")
          .select("*")
          .eq("product_id", Number(id))
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true });
        if (variantError) throw new Error(variantError.message);
        const nextVariants = (variantRows ?? []) as ProductVariant[];
        setVariants(nextVariants);
        setSelectedVariantId((current) =>
          current && nextVariants.some((variant) => variant.id === current)
            ? current
            : nextVariants[0]?.id ?? null
        );
        if ((data as Product).pricing_type === "custom_amount") {
          setCustomAmountRaw((current) => {
            const min = Number((data as Product).min_price_raw ?? 500_000);
            const max = Number((data as Product).max_price_raw ?? 10_000_000);
            return Math.min(max, Math.max(min, current || min));
          });
        }
        const stockSource = nextVariants[0] ?? data;
        setQty((current) => Math.max(1, Math.min(current, Number(stockSource.stock ?? 0) || 1)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
    const channel = supabase
      .channel(`product-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `id=eq.${id}` }, () => fetchProduct())
      .subscribe();
    const onFocus = () => fetchProduct();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    fetch("/api/exchange-rate", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setExchangeRate(typeof data?.rate === "number" ? data.rate : null))
      .catch(() => setExchangeRate(null));
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              <div className="w-full md:w-[380px] md:h-[380px] h-[280px] bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-3/4 bg-gray-200 rounded" />
                <div className="h-8 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded mt-8" />
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !product) {
    return (
      <PageWrapper>
        <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
          <p className="text-2xl font-bold text-[#511e0b] mb-4">{error || "Product not found"}</p>
          <Link href="/shop" className="text-[#511e0b] underline text-[15px]">
            Back to shop
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const stock = Number(product.stock ?? 0);
  const pricingType = product.pricing_type ?? "fixed";
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0] ?? null;
  const activeVariant = pricingType === "variant" ? selectedVariant : null;
  const activeStock = Number(activeVariant?.stock ?? stock);
  const minCustomAmount = Number(product.min_price_raw ?? 500_000);
  const maxCustomAmount = Number(product.max_price_raw ?? 10_000_000);
  const activePriceRaw = pricingType === "custom_amount"
    ? customAmountRaw
    : activeVariant?.price_raw ?? product.price_raw;
  const activePrice = pricingType === "custom_amount"
    ? `Rp${customAmountRaw.toLocaleString("id-ID")}`
    : activeVariant?.price ?? product.price;
  const specifications: [string, string][] = product.specifications
    ? Object.entries(product.specifications).map(normalizeSpec)
    : [
        ["Stock", String(stock)],
        ["Condition", "New"],
      ];
  const descriptionText = product.description || "A curated product from Indonesia.";
  const purchaseInstructions = product.purchase_instructions
    ? product.purchase_instructions.split(/\r?\n/).map((step) => step.trim()).filter(Boolean)
    : [];
  const imageSrc = resolveImagePath(product.image);
  const priceJpy = formatJpyFromIdr(activePriceRaw, exchangeRate);

  const shipping = {
    origin: "Indonesia",
    minWeight: "21 kg",
    airPrice: "Calculated at checkout",
    estimatedDelivery: "Calculated at checkout",
  };

  const handleAddToCart = () => {
    setCartMessage(null);
    if (activeStock <= 0) {
      setCartMessage(`${product.name} is out of stock.`);
      return;
    }
    if (pricingType === "custom_amount" && (customAmountRaw < minCustomAmount || customAmountRaw > maxCustomAmount)) {
      setCartMessage(`Budget must be between Rp${minCustomAmount.toLocaleString("id-ID")} and Rp${maxCustomAmount.toLocaleString("id-ID")}.`);
      return;
    }
    const result = addToCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        price: activePrice,
        price_raw: activePriceRaw,
        badge: product.badge || "",
        badge_color: product.badge_color || "bg-white",
        image: product.image,
        stock: activeStock,
        weight_kg: product.weight_kg,
        description: product.description,
        purchase_instructions: product.purchase_instructions,
        pricing_type: pricingType,
        min_price_raw: product.min_price_raw,
        max_price_raw: product.max_price_raw,
      },
      qty,
      {
        variant: activeVariant,
        customAmountRaw: pricingType === "custom_amount" ? customAmountRaw : null,
      },
    );
    if (result.message) setCartMessage(result.message);
    if (result.acceptedQty > 0) setShowCartPopup(true);
  };

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        <Link href="/shop" className="inline-flex items-center gap-1 text-[13px] text-[#6b6b6b] hover:text-[#511e0b] transition-colors no-underline mb-6">
          <ArrowLeft size={14} />
          Back to shop
        </Link>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="w-full md:w-[380px] md:h-[380px] h-[280px] overflow-hidden shrink-0 rounded-lg bg-[#f8f8f8]">
            <img alt={product.name} className="w-full h-full object-cover" src={imageSrc} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#511e0b] font-medium uppercase tracking-wider truncate">{product.category}</p>
            <h1 className="font-bold text-[26px] md:text-[30px] text-[#511e0b] tracking-tight mt-1 leading-snug break-words">{product.name}</h1>
            <p className="font-bold text-[28px] text-[#eb0d0d] mt-2">
              {pricingType === "custom_amount"
                ? `${activePrice} request budget`
                : activePrice}
            </p>
            {priceJpy && <p className="text-[14px] text-[#6b6b6b] mt-1">{priceJpy}</p>}

            <p className="text-[14px] text-[#6b6b6b] mt-1">
              Stock: <span className="text-[#511e0b] font-medium">{activeStock}</span>
            </p>

            {pricingType === "variant" && variants.length > 0 && (
              <div className="mt-5">
                <label className="block text-[12px] text-[#6b6b6b] tracking-widest uppercase mb-1.5">Variant</label>
                <select
                  value={selectedVariant?.id ?? ""}
                  onChange={(event) => {
                    const nextId = Number(event.target.value);
                    const next = variants.find((variant) => variant.id === nextId) ?? null;
                    setSelectedVariantId(next?.id ?? null);
                    setQty((current) => Math.max(1, Math.min(current, Number(next?.stock ?? stock) || 1)));
                  }}
                  className="w-full md:w-[360px] border border-[#b0b0b0] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b]"
                >
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} - {variant.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {pricingType === "custom_amount" && (
              <div className="mt-5 max-w-[440px]">
                <label className="block text-[12px] text-[#6b6b6b] tracking-widest uppercase mb-1.5">
                  Request Budget
                </label>
                <input
                  type="range"
                  min={minCustomAmount}
                  max={maxCustomAmount}
                  value={customAmountRaw}
                  onChange={(event) => setCustomAmountRaw(Number(event.target.value))}
                  className="w-full accent-[#511e0b]"
                />
                <input
                  type="number"
                  min={minCustomAmount}
                  max={maxCustomAmount}
                  value={customAmountRaw}
                  onChange={(event) => setCustomAmountRaw(Number(event.target.value))}
                  className="w-full mt-2 border border-[#b0b0b0] rounded-lg px-4 py-3 text-[14px] text-black outline-none focus:border-[#511e0b]"
                />
                <p className="text-[12px] text-[#6b6b6b] mt-1">
                  Choose any amount from Rp{minCustomAmount.toLocaleString("id-ID")} to Rp{maxCustomAmount.toLocaleString("id-ID")}.
                </p>
              </div>
            )}

            <div className="mt-5 flex items-start gap-2">
              <Truck size={18} className="text-[#15A15B] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[14px] text-[#511e0b] font-medium">Delivery estimate: {shipping.estimatedDelivery}</p>
                <p className="text-[13px] text-[#6b6b6b] mt-0.5">Checkout requirement: cart weight must reach {shipping.minWeight}</p>
              </div>
              <button
                onClick={() => setShowShippingModal(true)}
                className="text-[#6b6b6b] bg-transparent border-none cursor-pointer p-0 ml-1 shrink-0"
                aria-label="Open shipping details"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="border border-[#511e0b] rounded-md flex items-center h-10 w-32 justify-between px-3 shrink-0">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="text-[14px] text-[#511e0b] font-medium">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(activeStock, qty + 1))}
                  disabled={qty >= activeStock}
                  className="bg-transparent border-none cursor-pointer p-0 text-[#511e0b] hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={activeStock === 0 || qty > activeStock}
                className="flex-1 md:flex-none bg-[#511e0b] text-white rounded-md h-10 px-6 text-[14px] font-medium border-none cursor-pointer hover:bg-[#3d1608] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeStock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
            {cartMessage && <p className="mt-3 text-[13px] text-amber-700">{cartMessage}</p>}
          </div>
        </div>

        <div className="mt-12 border-t border-[#d5d5d5] pt-8">
          <h2 className="font-bold text-[19px] text-[#511e0b]">Product Specifications</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            {specifications.map(([label, value]) => (
              <div key={label} className="flex gap-4 py-2 border-b border-[#e0e0e0] min-w-0">
                <span className="text-[14px] text-[#6b6b6b] w-[140px] shrink-0">{label}</span>
                <span className="text-[14px] text-[#511e0b] font-medium break-words min-w-0">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-bold text-[19px] text-[#511e0b]">Product Description</h2>
          <div className="text-[14px] text-gray-700 mt-4 leading-relaxed">
            <p>{descriptionText}</p>
          </div>
        </div>

        {purchaseInstructions.length > 0 && (
          <div className="mt-10">
            <h2 className="font-bold text-[19px] text-[#511e0b]">How to order</h2>
            <ol className="mt-4 list-decimal pl-5 space-y-2 text-[14px] text-gray-700 leading-relaxed">
              {purchaseInstructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-10 border-t border-[#d5d5d5] pt-8">
          <h2 className="font-bold text-[19px] text-[#511e0b]">Shipping Details</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[#6b6b6b] mt-0.5 shrink-0" />
              <p className="text-[14px] text-gray-700">Ships from <span className="font-medium text-[#511e0b]">{shipping.origin}</span></p>
            </div>
            <div className="flex items-start gap-3">
              <Box size={18} className="text-[#6b6b6b] mt-0.5 shrink-0" />
              <p className="text-[14px] text-gray-700">Minimum <span className="font-medium">{shipping.minWeight}</span> per shipment</p>
            </div>
            <div className="flex items-start gap-3">
              <Truck size={18} className="text-[#6b6b6b] mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] text-gray-700">Air shipping: <span className="font-medium text-[#511e0b]">{shipping.airPrice}</span></p>
                <p className="text-[13px] text-[#6b6b6b] mt-0.5">Estimated delivery: {shipping.estimatedDelivery}</p>
              </div>
            </div>
            <button
              className="text-[14px] font-bold text-[#511e0b] hover:text-[#3d1608] transition-colors cursor-pointer bg-transparent border-none p-0"
              onClick={() => setShowShippingModal(true)}
            >
              View shipping details →
            </button>
          </div>
        </div>
      </div>

      <AddToCartPopup isOpen={showCartPopup} onClose={() => setShowCartPopup(false)} productName={product.name} />
      <ShippingDetailModal isOpen={showShippingModal} onClose={() => setShowShippingModal(false)} />
    </PageWrapper>
  );
}
