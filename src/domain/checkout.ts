import { createHash } from "node:crypto";

export const MIN_CHECKOUT_WEIGHT_KG = 21;
export const SNAP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_BUYER_ITEM_NOTE_LENGTH = 2000;

export interface CheckoutItemInput {
  productId: number;
  quantity: number;
  variantId?: number | null;
  customAmountRaw?: number | null;
  buyerNote?: string | null;
}

export interface CheckoutProduct {
  id: number;
  name: string;
  category: string;
  priceRaw: number;
  price: string;
  weightKg: number;
  stock: number;
  description?: string | null;
  pricingType?: "fixed" | "variant" | "custom_amount";
  minPriceRaw?: number | null;
  maxPriceRaw?: number | null;
  variants?: CheckoutProductVariant[];
}

export interface CheckoutProductVariant {
  id: number;
  productId: number;
  name: string;
  priceRaw: number;
  price: string;
  stock: number;
  weightKg?: number | null;
}

export interface PricedCheckoutItem {
  product: CheckoutProduct;
  variant?: CheckoutProductVariant | null;
  quantity: number;
  unitPriceRaw: number;
  price: string;
  customAmountRaw?: number | null;
  buyerNote?: string | null;
  lineTotal: number;
  lineWeightKg: number;
}

export interface CheckoutPricing {
  subtotal: number;
  shippingCost: number;
  serviceFee: number;
  grandTotal: number;
  totalWeightKg: number;
}

export interface ShippingCommodity {
  productId: number;
  name: string;
  category: string;
  quantity: number;
  unitPriceIdr: number;
  lineValueIdr: number;
  unitWeightKg: number;
  lineWeightKg: number;
  countryOfManufacture: "ID";
}

export interface ShippingDestination {
  postalCode: string;
  countryCode: string;
}

function normalizeBuyerNote(note: string | null | undefined): string {
  const normalized = String(note ?? "").trim();
  if (normalized.length > MAX_BUYER_ITEM_NOTE_LENGTH) {
    throw new Error(`Item note must be ${MAX_BUYER_ITEM_NOTE_LENGTH} characters or less.`);
  }
  return normalized;
}

export function normalizeCheckoutItems(items: CheckoutItemInput[]): CheckoutItemInput[] {
  const grouped = new Map<string, CheckoutItemInput>();

  for (const item of items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw new Error("Invalid product id.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Invalid product quantity.");
    }
    const variantId = item.variantId == null ? null : Number(item.variantId);
    if (variantId !== null && (!Number.isInteger(variantId) || variantId <= 0)) {
      throw new Error("Invalid product variant.");
    }
    const customAmountRaw = item.customAmountRaw == null ? null : Number(item.customAmountRaw);
    if (customAmountRaw !== null && (!Number.isInteger(customAmountRaw) || customAmountRaw <= 0)) {
      throw new Error("Invalid custom amount.");
    }
    const buyerNote = normalizeBuyerNote(item.buyerNote);
    const key = `${item.productId}:${variantId ?? ""}:${customAmountRaw ?? ""}`;
    const existing = grouped.get(key);
    if (
      existing
      && buyerNote
      && existing.buyerNote
      && existing.buyerNote !== buyerNote
    ) {
      throw new Error("Duplicate cart item has conflicting notes.");
    }
    grouped.set(key, {
      productId: item.productId,
      variantId,
      customAmountRaw,
      buyerNote: existing?.buyerNote || buyerNote || null,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  return [...grouped.values()]
    .sort((a, b) =>
      a.productId - b.productId
      || (a.variantId ?? 0) - (b.variantId ?? 0)
      || (a.customAmountRaw ?? 0) - (b.customAmountRaw ?? 0)
    );
}

export function priceCheckoutItems(
  items: CheckoutItemInput[],
  products: CheckoutProduct[],
): PricedCheckoutItem[] {
  const productById = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} is no longer available.`);
    }
    const pricingType = product.pricingType ?? "fixed";
    const variant = item.variantId
      ? product.variants?.find((candidate) => candidate.id === item.variantId)
      : null;

    if (pricingType === "variant" && !variant) {
      throw new Error(`Select a valid variant for ${product.name}.`);
    }
    if (pricingType !== "variant" && item.variantId) {
      throw new Error(`Invalid variant for ${product.name}.`);
    }
    if (pricingType !== "custom_amount" && item.customAmountRaw) {
      throw new Error(`Invalid custom amount for ${product.name}.`);
    }

    let unitPriceRaw = product.priceRaw;
    let price = product.price;
    let stock = product.stock;
    let unitWeightKg = product.weightKg;

    if (variant) {
      unitPriceRaw = variant.priceRaw;
      price = variant.price;
      stock = variant.stock;
      unitWeightKg = Number(variant.weightKg ?? product.weightKg);
    } else if (pricingType === "custom_amount") {
      const amount = item.customAmountRaw;
      if (!amount) {
        throw new Error(`Choose a request budget for ${product.name}.`);
      }
      const min = Number(product.minPriceRaw ?? 0);
      const max = Number(product.maxPriceRaw ?? 0);
      if (amount < min || amount > max) {
        throw new Error(`${product.name} budget must be between ${formatRp(min)} and ${formatRp(max)}.`);
      }
      unitPriceRaw = amount;
      price = formatRp(amount);
    }

    if (!Number.isFinite(unitPriceRaw) || unitPriceRaw <= 0) {
      throw new Error(`Invalid price for ${product.name}.`);
    }
    if (!Number.isFinite(unitWeightKg) || unitWeightKg <= 0) {
      throw new Error(`Invalid weight for ${product.name}.`);
    }
    if (stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }
    return {
      product,
      variant,
      quantity: item.quantity,
      unitPriceRaw,
      price,
      customAmountRaw: item.customAmountRaw ?? null,
      buyerNote: item.buyerNote ?? null,
      lineTotal: unitPriceRaw * item.quantity,
      lineWeightKg: unitWeightKg * item.quantity,
    };
  });
}

export function buildShippingCommodities(pricedItems: PricedCheckoutItem[]): ShippingCommodity[] {
  return pricedItems.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    category: item.product.category,
    quantity: item.quantity,
    unitPriceIdr: item.unitPriceRaw,
    lineValueIdr: item.lineTotal,
    unitWeightKg: item.lineWeightKg / item.quantity,
    lineWeightKg: item.lineWeightKg,
    countryOfManufacture: "ID",
  }));
}

export function calculateCheckoutPricing(
  pricedItems: PricedCheckoutItem[],
  shippingCost: number,
): CheckoutPricing {
  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalWeightKg = pricedItems.reduce((sum, item) => sum + item.lineWeightKg, 0);
  const serviceFee = Math.round(subtotal * 0.01);
  const grandTotal = subtotal + shippingCost + serviceFee;

  if (totalWeightKg < MIN_CHECKOUT_WEIGHT_KG) {
    throw new Error(
      `Minimum order weight is ${MIN_CHECKOUT_WEIGHT_KG} kg. Current cart weight: ${totalWeightKg.toFixed(2)} kg.`,
    );
  }

  return {
    subtotal,
    shippingCost,
    serviceFee,
    grandTotal,
    totalWeightKg,
  };
}

export function createCartFingerprint(input: {
  addressId: string;
  items: CheckoutItemInput[];
  pricing: CheckoutPricing;
}): string {
  const canonical = JSON.stringify({
    addressId: input.addressId,
    items: normalizeCheckoutItems(input.items),
    subtotal: input.pricing.subtotal,
    shippingCost: input.pricing.shippingCost,
    serviceFee: input.pricing.serviceFee,
    grandTotal: input.pricing.grandTotal,
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export function formatRp(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export function buildMidtransItemDetails(
  pricedItems: PricedCheckoutItem[],
  pricing: CheckoutPricing,
): Array<{ id: string; price: number; quantity: number; name: string }> {
  return [
    ...pricedItems.map((item) => ({
      id: item.variant
        ? `${item.product.id}-${item.variant.id}`
        : item.customAmountRaw
          ? `${item.product.id}-custom-${item.customAmountRaw}`
          : String(item.product.id),
      price: item.unitPriceRaw,
      quantity: item.quantity,
      name: (item.variant ? `${item.product.name} - ${item.variant.name}` : item.product.name).slice(0, 50),
    })),
    { id: "SHIPPING", price: pricing.shippingCost, quantity: 1, name: "Air Shipping" },
    { id: "SERVICE_FEE", price: pricing.serviceFee, quantity: 1, name: "Service Fee" },
  ];
}
