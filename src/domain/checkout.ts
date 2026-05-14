import { createHash } from "node:crypto";

export const MIN_CHECKOUT_WEIGHT_KG = 21;
export const SNAP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface CheckoutItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutProduct {
  id: number;
  name: string;
  category: string;
  priceRaw: number;
  price: string;
  weightKg: number;
  stock: number;
}

export interface PricedCheckoutItem {
  product: CheckoutProduct;
  quantity: number;
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

export function normalizeCheckoutItems(items: CheckoutItemInput[]): CheckoutItemInput[] {
  const grouped = new Map<number, number>();

  for (const item of items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw new Error("Invalid product id.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Invalid product quantity.");
    }
    grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + item.quantity);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([productId, quantity]) => ({ productId, quantity }));
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
    if (!Number.isFinite(product.priceRaw) || product.priceRaw <= 0) {
      throw new Error(`Invalid price for ${product.name}.`);
    }
    if (!Number.isFinite(product.weightKg) || product.weightKg <= 0) {
      throw new Error(`Invalid weight for ${product.name}.`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }
    return {
      product,
      quantity: item.quantity,
      lineTotal: product.priceRaw * item.quantity,
      lineWeightKg: product.weightKg * item.quantity,
    };
  });
}

export function buildShippingCommodities(pricedItems: PricedCheckoutItem[]): ShippingCommodity[] {
  return pricedItems.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    category: item.product.category,
    quantity: item.quantity,
    unitPriceIdr: item.product.priceRaw,
    lineValueIdr: item.lineTotal,
    unitWeightKg: item.product.weightKg,
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
      id: String(item.product.id),
      price: item.product.priceRaw,
      quantity: item.quantity,
      name: item.product.name.slice(0, 50),
    })),
    { id: "SHIPPING", price: pricing.shippingCost, quantity: 1, name: "Air Shipping" },
    { id: "SERVICE_FEE", price: pricing.serviceFee, quantity: 1, name: "Service Fee" },
  ];
}
