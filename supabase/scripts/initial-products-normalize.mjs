export const DEFAULT_PRODUCT_STOCK = 25;
export const CUSTOM_BOX_BOOTSTRAP_KEY = "custom:custom-box-jastip-21kg";

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

export function purchaseDescription({ name, sourceUrl }) {
  const source = sourceUrl ? ` Source link: ${sourceUrl}` : "";
  return `Tokonesia assisted purchase item. Add size, color, flavor, or other request details in the checkout note when needed.${source}`;
}

export function normalizeIndogrosirPayload(payload, { query }) {
  const products = Array.isArray(payload?.product_details) ? payload.product_details : [];
  return products
    .filter((item) => item?.prdcd && item?.long_description && item?.url_pic_prod)
    .map((item) => {
      const priceRaw = parseIdrPrice(item.prmd_hrgjual ?? item.hrg_jual);
      const category = categoryForQuery(query, "indogrosir");
      const sourceUrl = `https://klikindogrosir.com/filterKey?key=${encodeURIComponent(query)}`;
      const name = String(item.long_description).replace(/\s+/g, " ").trim();
      return {
        bootstrap_key: `indogrosir:${item.prdcd}`,
        source_provider: "indogrosir",
        source_product_id: String(item.prdcd),
        source_query: query,
        source_url: sourceUrl,
        source_metadata: {
          kode_igr: item.kode_igr ?? null,
          unit: item.unit ?? null,
          frac: item.frac ?? null,
          min_jual: item.min_jual ?? null,
          pricelist: item.pricelist ?? [],
        },
        name,
        category,
        price_raw: priceRaw,
        price: formatRp(priceRaw),
        stock: item.isAvailable ? DEFAULT_PRODUCT_STOCK : 0,
        weight_kg: estimateWeightKg(name, category),
        image_source_url: item.url_pic_prod,
        image_object_path: "",
        description: `${name} sourced from Klik Indogrosir for Tokonesia assisted purchase.`,
        purchase_description: purchaseDescription({ name, sourceUrl }),
        specifications: {
          Source: "Klik Indogrosir",
          Unit: String(item.unit ?? "PCS"),
        },
        pricing_type: "fixed",
        min_price_raw: null,
        max_price_raw: null,
        variants: [],
      };
    })
    .filter((item) => item.price_raw > 0);
}

export function normalizeZaloraPayload(payload, { query }) {
  const products = Array.isArray(payload?.data?.Products) ? payload.data.Products : [];
  return products
    .filter((item) => item?.ConfigSku && item?.Name && (item?.MainImageUrl || item?.ImageList?.[0]))
    .map((item) => {
      const priceRaw = parseIdrPrice(item.SpecialPriceInDecimal || item.PriceInDecimal || item.SpecialPrice || item.Price);
      const breadcrumbs = Array.isArray(item.Breadcrumbs) ? item.Breadcrumbs : [];
      const category = categoryForQuery(query, "zalora", breadcrumbs);
      const path = String(item.ProductUrl ?? "").replace(/^\/+/, "");
      const sourceUrl = path ? `https://www.zalora.co.id/${path}` : `https://www.zalora.co.id/catalog/?q=${encodeURIComponent(query)}`;
      const name = String(item.Name).replace(/\s+/g, " ").trim();
      return {
        bootstrap_key: `zalora:${item.ConfigSku}`,
        source_provider: "zalora",
        source_product_id: String(item.ConfigSku),
        source_query: query,
        source_url: sourceUrl,
        source_metadata: {
          brand: item.Brand ?? null,
          breadcrumbs,
          price: item.Price ?? null,
          special_price: item.SpecialPrice ?? null,
          markdown_label: item.MarkdownLabel ?? null,
          review_statistics: item.ReviewStatistics ?? null,
        },
        name,
        category,
        price_raw: priceRaw,
        price: formatRp(priceRaw),
        stock: DEFAULT_PRODUCT_STOCK,
        weight_kg: estimateWeightKg(name, category),
        image_source_url: item.MainImageUrl || item.ImageList?.[0],
        image_object_path: "",
        description: `${name} sourced from Zalora Indonesia for Tokonesia assisted purchase.`,
        purchase_description: purchaseDescription({ name, sourceUrl }),
        specifications: {
          Source: "Zalora Indonesia",
          Brand: String(item.Brand ?? item.SupplierName ?? ""),
          Category: breadcrumbs.join(" > "),
        },
        pricing_type: "fixed",
        min_price_raw: null,
        max_price_raw: null,
        variants: [],
      };
    })
    .filter((item) => item.price_raw > 0);
}

export function customBoxProduct() {
  return {
    bootstrap_key: CUSTOM_BOX_BOOTSTRAP_KEY,
    source_provider: "tokonesia",
    source_product_id: "custom-box-jastip-21kg",
    source_query: "custom box",
    source_url: null,
    source_metadata: { type: "custom_box", max_weight_kg: 21 },
    name: "Custom Box Jastip 21kg",
    category: "Jastip Box",
    price_raw: 500000,
    price: "From Rp500.000",
    stock: 999,
    weight_kg: 21,
    image_source_url: null,
    image_object_path: "initial/custom-box-jastip-21kg.jpg",
    description: "Rent one 21kg Tokonesia jastip box and fill it with Indonesian goods you want us to buy, pack together, and ship to your address.",
    purchase_description:
      "Use this box for a combined assisted purchase request up to 21kg. Add product links, size, color, flavor, budget allocation, and any buying instructions in the checkout note. Tokonesia will buy the requested items, pack them together, and ship them to your address.",
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
