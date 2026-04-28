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
    price_raw: 397700,
    badge: "SALE",
    badge_color: "bg-white",
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
    stock: 7,
  },
  {
    id: 2,
    name: "Atasan Batik Tenun Emma Black",
    category: "Fashion",
    price: "Rp131.822",
    price_raw: 131822,
    badge: "NEW",
    badge_color: "bg-white",
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    img_style: "left-[-30px] w-[265px] h-[265px] top-[-34px]",
    stock: 15,
  },
  {
    id: 3,
    name: "Cengkeh Utuh Rempah Organik - Bumbu Masak Premium",
    category: "Herbs and Spices",
    price: "Rp22.800",
    price_raw: 22800,
    badge: "Pre-order",
    badge_color: "bg-[#ef5c5c]",
    badge_width: "w-[81px]",
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
    stock: 30,
  },
  {
    id: 4,
    name: "Cosmos Kipas Angin Meja 12-WFBL",
    category: "Electronic",
    price: "Rp285.000",
    price_raw: 285000,
    badge: "SALE",
    badge_color: "bg-white",
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
    stock: 4,
  },
  {
    id: 5,
    name: "Kemeja Batik Pria Lengan Panjang",
    category: "Fashion",
    price: "Rp175.000",
    price_raw: 175000,
    badge: "NEW",
    badge_color: "bg-white",
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    img_style: "left-[-30px] w-[265px] h-[265px] top-[-34px]",
    stock: 20,
  },
  {
    id: 6,
    name: "Jahe Merah Bubuk Organik 100gr",
    category: "Herbs and Spices",
    price: "Rp35.500",
    price_raw: 35500,
    badge: "Pre-order",
    badge_color: "bg-[#ef5c5c]",
    badge_width: "w-[81px]",
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
    stock: 50,
  },
  {
    id: 7,
    name: "Rice Cooker Mini Cosmos 1.8L",
    category: "Electronic",
    price: "Rp425.000",
    price_raw: 425000,
    badge: "SALE",
    badge_color: "bg-white",
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
    stock: 10,
  },
  {
    id: 8,
    name: "Dress Batik Wanita Modern",
    category: "Fashion",
    price: "Rp210.000",
    price_raw: 210000,
    badge: "NEW",
    badge_color: "bg-white",
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    img_style: "left-[-30px] w-[265px] h-[265px] top-[-34px]",
    stock: 8,
  },
  {
    id: 9,
    name: "Kunyit Asam Serbuk Premium 200gr",
    category: "Herbs and Spices",
    price: "Rp18.500",
    price_raw: 18500,
    badge: "Pre-order",
    badge_color: "bg-[#ef5c5c]",
    badge_width: "w-[81px]",
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
    stock: 100,
  },
];

// Product detail data (for /product/[id] page)
export const productDetails: Record<number, {
  id: number;
  name: string;
  category: string;
  price: string;
  price_raw: number;
  image: string;
  stock: number;
  specifications: [string, string][];
  description: { text: string; features: string[] };
  shipping: { origin: string; minWeight: string; airPrice: string; estimatedDelivery: string };
}> = {
  1: {
    id: 1,
    name: "Cosmos Kipas Angin Wall Fan 16-WFGR",
    category: "Electronic",
    price: "Rp397.700",
    price_raw: 397700,
    image: "/images/Shop/c08f2321d986609404c2bdb84a34d05860464a4c.png",
    stock: 7,
    specifications: [
      ["Stok", "7"],
      ["Merk", "Cosmos"],
      ["Condition", "New"],
      ["Unit weight", "5kg"],
      ["Voltage", "220V"],
      ["Guarantee", "12 Month"],
    ],
    description: {
      text: "Cosmos Fan 16-WFGR dilengkapi dengan Remote, Thermostat untuk memberi perlindungan Terhadap Panas Berlebih, baling-baling super spread, dan rendah daya dengan Masukan 46 Watt",
      features: [
        "Kipas angin dinding / wall fan dengan Remote",
        "Bilah kipas berukuran 16 inch, 3 level kecepatan & tombol berhenti",
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
  },
  2: {
    id: 2,
    name: "Atasan Batik Tenun Emma Black",
    category: "Fashion",
    price: "Rp131.822",
    price_raw: 131822,
    image: "/images/Shop/b6a7e5cd3e1ecbab09011f9b86a0f35e1343f16c.png",
    stock: 15,
    specifications: [
      ["Stok", "15"],
      ["Merk", "Emma"],
      ["Condition", "New"],
      ["Unit weight", "0.3kg"],
      ["Material", "Tenun"],
      ["Size", "S, M, L, XL"],
    ],
    description: {
      text: "Atasan batik tenun premium dari brand lokal Emma, dibuat dengan kain tenun berkualitas tinggi yang nyaman dipakai sehari-hari maupun acara formal.",
      features: [
        "Kain tenun premium pilihan",
        "Motif batik kontemporer",
        "Tersedia berbagai ukuran S-XL",
        "Cocok untuk acara formal dan kasual",
        "Produk lokal Indonesia berkualitas",
      ],
    },
    shipping: {
      origin: "Yogyakarta, Indonesia",
      minWeight: "5 kg",
      airPrice: "Rp220.000",
      estimatedDelivery: "Apr 14 - June 25",
    },
  },
  3: {
    id: 3,
    name: "Cengkeh Utuh Rempah Organik - Bumbu Masak Premium",
    category: "Herbs and Spices",
    price: "Rp22.800",
    price_raw: 22800,
    image: "/images/Shop/c61786a514cc0bb3370a78c942d19d2074308457.png",
    stock: 30,
    specifications: [
      ["Stok", "30"],
      ["Merk", "Rempah Nusantara"],
      ["Condition", "New"],
      ["Unit weight", "0.1kg"],
      ["Berat bersih", "100gr"],
      ["Jenis", "Organik"],
    ],
    description: {
      text: "Cengkeh utuh organik pilihan dari petani lokal Indonesia, dikeringkan secara alami tanpa bahan pengawet untuk menjaga cita rasa dan aroma autentik.",
      features: [
        "100% organik tanpa pestisida",
        "Dipanen langsung dari petani Maluku",
        "Dikeringkan secara alami",
        "Aroma kuat dan cita rasa autentik",
        "Cocok untuk masakan dan minuman",
      ],
    },
    shipping: {
      origin: "Maluku, Indonesia",
      minWeight: "3 kg",
      airPrice: "Rp180.000",
      estimatedDelivery: "Apr 15 - June 28",
    },
  },
};

export function getProductById(id: number): (typeof productDetails)[number] | Product | undefined {
  return productDetails[id] ?? products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function formatPrice(raw: number): string {
  return "Rp" + raw.toLocaleString("id-ID");
}
