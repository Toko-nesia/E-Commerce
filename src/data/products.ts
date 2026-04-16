// =============================================================================
// Products data — hardcoded for now
// Future: export async function getProducts() { return supabase.from('products').select('*') }
// =============================================================================
import type { Product } from "@/types/database";

export const products: Product[] = [
  {
    id: 1,
    name: "Cosmos Kipas Angin Wall Fan 16-WFGR",
    category: "Electronic",
    price: "Rp397.700",
    badge: "SALE",
    badge_color: "bg-white",
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
  },
  {
    id: 2,
    name: "Atasan Batik Tenun Emma Black",
    category: "Fashion",
    price: "Rp131.822",
    badge: "NEW",
    badge_color: "bg-white",
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    img_style: "left-[-30px] w-[265px] h-[265px] top-[-34px]",
  },
  {
    id: 3,
    name: "Cengkeh Utuh Rempah Organik - B...",
    category: "Herbs and Spices",
    price: "Rp22.800",
    badge: "Pre-order",
    badge_color: "bg-[#ef5c5c]",
    badge_width: "w-[81px]",
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
  },
  {
    id: 4,
    name: "Cosmos Kipas Angin Wall Fan 16-WFGR",
    category: "Electronic",
    price: "Rp397.700",
    badge: "SALE",
    badge_color: "bg-white",
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
  },
  {
    id: 5,
    name: "Atasan Batik Tenun Emma Black",
    category: "Fashion",
    price: "Rp131.822",
    badge: "NEW",
    badge_color: "bg-white",
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    img_style: "left-[-30px] w-[265px] h-[265px] top-[-34px]",
  },
  {
    id: 6,
    name: "Cengkeh Utuh Rempah Organik - B...",
    category: "Herbs and Spices",
    price: "Rp22.800",
    badge: "Pre-order",
    badge_color: "bg-[#ef5c5c]",
    badge_width: "w-[81px]",
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
  },
  {
    id: 7,
    name: "Cosmos Kipas Angin Wall Fan 16-WFGR",
    category: "Electronic",
    price: "Rp397.700",
    badge: "SALE",
    badge_color: "bg-white",
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
  },
  {
    id: 8,
    name: "Atasan Batik Tenun Emma Black",
    category: "Fashion",
    price: "Rp131.822",
    badge: "NEW",
    badge_color: "bg-white",
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    img_style: "left-[-30px] w-[265px] h-[265px] top-[-34px]",
  },
  {
    id: 9,
    name: "Cengkeh Utuh Rempah Organik - B...",
    category: "Herbs and Spices",
    price: "Rp22.800",
    badge: "Pre-order",
    badge_color: "bg-[#ef5c5c]",
    badge_width: "w-[81px]",
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
  },
];

// Product detail data (for /product/[id] page)
export const productDetail = {
  id: 1,
  name: "Cosmos Kipas Angin Wall Fan 16-WFGR",
  category: "Electronic",
  price: "Rp397.700",
  image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
  specifications: [
    ["Stok", "7"],
    ["Merk", "Cosmos"],
    ["Condition", "New"],
    ["Unit weight", "5kg"],
    ["Voltage", "220V"],
    ["Guarantee", "12 Month"],
  ] as [string, string][],
  description: {
    text: "Cosmos Fan 16-WFGR dilengkapi dengan Remote, Thermostat untuk memberi perlindungan Terhadap Panas Berlebih, baling - baling super spread, dan rendah daya dengan Masukan 46 Watt",
    features: [
      "Kipas angin dinding / wall fan dengan Remote",
      "Bilah kipas berukuran 16 inch3 level kecepatan & tombol berhenti",
      "Superspread (penyebaran angin lebih merata)",
      "Garansi motor 5 tahun",
      "Daya masukan 46 Watt",
    ],
  },
  shipping: {
    origin: "Solo, Indonesia",
    minWeight: "21 kg",
    airPrice: "Rp350.000",
    estimatedDelivery: "Apr 12 - June 21",
  },
};

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}
