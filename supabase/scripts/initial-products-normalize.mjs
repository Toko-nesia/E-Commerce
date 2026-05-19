import { createHash } from "node:crypto";

export const DEFAULT_PRODUCT_STOCK = 1000;
export const CUSTOM_BOX_PURCHASE_INSTRUCTIONS = [
  "Choose your request budget with the slider.",
  "Add the box to cart.",
  "In the item note, paste product links or write the item list with quantity, size, color, flavor, and any replacement preferences.",
  "Checkout and complete payment.",
  "Tokonesia reviews the request, buys or collects the items, packs them into one box up to 21kg, and ships to the selected address.",
].join("\n");
export const CUSTOM_BOX_BOOTSTRAP_KEY = neutralBootstrapKey("custom-box-jastip-21kg");

export function neutralBootstrapKey(seed) {
  const hash = createHash("md5").update(String(seed)).digest("hex").slice(0, 16);
  return `initial:${hash}`;
}

export function neutralImageObjectPath(bootstrapKey, extension = ".webp") {
  const safeKey = String(bootstrapKey).replace(/^initial:/, "").replace(/[^a-f0-9]/gi, "");
  return `initial/${safeKey || createHash("md5").update(String(bootstrapKey)).digest("hex").slice(0, 16)}${extension}`;
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatRp(amount) {
  return `Rp${Number(amount || 0).toLocaleString("id-ID")}`;
}

export function parseIdrPrice(value) {
  if (typeof value === "number") return Math.round(value);
  const numeric = String(value ?? "").replace(/[^\d]/g, "");
  return Number.parseInt(numeric, 10) || 0;
}

export function categoryForQuery(query, provider, breadcrumbs = []) {
  const normalized = query.toLowerCase();
  const crumbText = breadcrumbs.join(" ").toLowerCase();
  if (normalized.includes("mie")) return "Instant Noodles";
  if (normalized.includes("cemilan") || normalized.includes("snack")) return "Snacks";
  if (normalized.includes("kopi") || normalized.includes("teh")) return "Coffee & Tea";
  if (normalized.includes("bumbu") || normalized.includes("sambal")) return "Pantry";
  if (normalized.includes("sepatu") || crumbText.includes("sepatu")) return "Shoes";
  if (normalized.includes("tas") || crumbText.includes("tas")) return "Bags";
  if (normalized.includes("pakaian") || normalized.includes("batik") || provider === "zalora") return "Fashion";
  return "Indonesian Goods";
}

export function estimateWeightKg(name, category) {
  const text = `${name} ${category}`.toLowerCase();
  const kg = text.match(/(\d+(?:[,.]\d+)?)\s*kg\b/);
  if (kg) return Math.max(0.05, Number(kg[1].replace(",", ".")));

  const gram = text.match(/(\d+(?:[,.]\d+)?)\s*(?:g|gr|gram)\b/);
  if (gram) return Math.max(0.05, Number(gram[1].replace(",", ".")) / 1000);

  const ml = text.match(/(\d+(?:[,.]\d+)?)\s*ml\b/);
  if (ml) return Math.max(0.05, Number(ml[1].replace(",", ".")) / 1000);

  const liter = text.match(/(\d+(?:[,.]\d+)?)\s*(?:l|liter)\b/);
  if (liter) return Math.max(0.05, Number(liter[1].replace(",", ".")));

  if (category === "Shoes") return 1.1;
  if (category === "Bags") return 0.8;
  if (category === "Fashion") return 0.4;
  if (category === "Instant Noodles") return 0.09;
  if (category === "Snacks") return 0.15;
  if (category === "Coffee & Tea") return 0.25;
  return 0.3;
}

export function normalizeIndogrosirPayload(payload, { query, includeDownloadUrl = false }) {
  const products = Array.isArray(payload?.product_details) ? payload.product_details : [];
  return products
    .filter((item) => item?.prdcd && item?.long_description && item?.url_pic_prod)
    .map((item) => {
      const priceRaw = parseIdrPrice(item.prmd_hrgjual ?? item.hrg_jual);
      const category = categoryForQuery(query, "indogrosir");
      const name = String(item.long_description).replace(/\s+/g, " ").trim();
      const bootstrapKey = neutralBootstrapKey(`indogrosir:${item.prdcd}`);
      const product = {
        bootstrap_key: bootstrapKey,
        name,
        category,
        price_raw: priceRaw,
        price: formatRp(priceRaw),
        stock: DEFAULT_PRODUCT_STOCK,
        weight_kg: estimateWeightKg(name, category),
        image_object_path: neutralImageObjectPath(bootstrapKey),
        description: name,
        purchase_instructions: null,
        specifications: {
          Unit: String(item.unit ?? "PCS"),
        },
        pricing_type: "fixed",
        min_price_raw: null,
        max_price_raw: null,
        variants: [],
      };
      return includeDownloadUrl ? { ...product, _image_download_url: item.url_pic_prod } : product;
    })
    .filter((item) => item.price_raw > 0);
}

export function normalizeZaloraPayload(payload, { query, includeDownloadUrl = false }) {
  const products = Array.isArray(payload?.data?.Products) ? payload.data.Products : [];
  return products
    .filter((item) => item?.ConfigSku && item?.Name && (item?.MainImageUrl || item?.ImageList?.[0]))
    .map((item) => {
      const priceRaw = parseIdrPrice(item.SpecialPriceInDecimal || item.PriceInDecimal || item.SpecialPrice || item.Price);
      const breadcrumbs = Array.isArray(item.Breadcrumbs) ? item.Breadcrumbs : [];
      const category = categoryForQuery(query, "zalora", breadcrumbs);
      const name = String(item.Name).replace(/\s+/g, " ").trim();
      const bootstrapKey = neutralBootstrapKey(`zalora:${item.ConfigSku}`);
      const product = {
        bootstrap_key: bootstrapKey,
        name,
        category,
        price_raw: priceRaw,
        price: formatRp(priceRaw),
        stock: DEFAULT_PRODUCT_STOCK,
        weight_kg: estimateWeightKg(name, category),
        image_object_path: neutralImageObjectPath(bootstrapKey),
        description: name,
        purchase_instructions: null,
        specifications: {
          Brand: String(item.Brand ?? item.SupplierName ?? ""),
          Category: breadcrumbs.join(" > "),
        },
        pricing_type: "fixed",
        min_price_raw: null,
        max_price_raw: null,
        variants: [],
      };
      return includeDownloadUrl ? { ...product, _image_download_url: item.MainImageUrl || item.ImageList?.[0] } : product;
    })
    .filter((item) => item.price_raw > 0);
}

export function customBoxProduct() {
  return {
    bootstrap_key: CUSTOM_BOX_BOOTSTRAP_KEY,
    name: "Custom Box Jastip 21kg",
    category: "Jastip Box",
    price_raw: 500000,
    price: "From Rp500.000",
    stock: DEFAULT_PRODUCT_STOCK,
    weight_kg: 21,
    image_object_path: neutralImageObjectPath(CUSTOM_BOX_BOOTSTRAP_KEY, ".jpg"),
    description: "Rent one 21kg Tokonesia jastip box and fill it with Indonesian goods you want us to buy, pack together, and ship to your address.",
    purchase_instructions: CUSTOM_BOX_PURCHASE_INSTRUCTIONS,
    specifications: {
      Capacity: "21 kg",
      Service: "Assisted purchase, packing, and international shipping",
    },
    pricing_type: "custom_amount",
    min_price_raw: 500000,
    max_price_raw: 10000000,
    variants: [],
  };
}
