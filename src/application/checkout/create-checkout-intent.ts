import {
  SNAP_TOKEN_TTL_MS,
  buildMidtransItemDetails,
  buildShippingCommodities,
  calculateCheckoutPricing,
  createCartFingerprint,
  normalizeCheckoutItems,
  priceCheckoutItems,
  type CheckoutItemInput,
  type CheckoutPricing,
  type CheckoutProduct,
  type ShippingCommodity,
  type ShippingDestination,
} from "@/domain/checkout";

export interface CheckoutAddress {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  fullAddress: string;
  details: string;
  postalCode: string;
  countryCode: string;
}

export interface ExistingCheckoutOrder {
  id: string;
  midtransOrderId: string;
  idempotencyKey: string | null;
  cartFingerprint: string | null;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  snapTokenExpiresAt: string | null;
}

export interface CreatedCheckoutOrder {
  id: string;
  midtransOrderId: string;
}

export interface CreateCheckoutOrderInput {
  id: string;
  userId: string;
  idempotencyKey: string;
  cartFingerprint: string;
  address: CheckoutAddress;
  items: Array<{
    productId: number;
    productVariantId?: number | null;
    quantity: number;
    priceRaw: number;
    price: string;
    customAmountRaw?: number | null;
    purchaseDescriptionSnapshot?: string | null;
    sourceSnapshot?: Record<string, unknown>;
  }>;
  pricing: CheckoutPricing;
  note: string;
  cartSnapshot: unknown;
  shippingSnapshot: unknown;
}

export interface CheckoutRepository {
  findOrderByIdempotency(userId: string, idempotencyKey: string): Promise<ExistingCheckoutOrder | null>;
  getAddressForUser(userId: string, addressId: string): Promise<CheckoutAddress | null>;
  getProductsByIds(productIds: number[]): Promise<CheckoutProduct[]>;
  createPendingOrder(input: CreateCheckoutOrderInput): Promise<CreatedCheckoutOrder>;
  attachSnapToken(input: {
    orderId: string;
    token: string;
    redirectUrl: string;
    expiresAt: Date;
  }): Promise<void>;
}

export interface ShippingRateProvider {
  getShippingRate(input: {
    destination: ShippingDestination;
    commodities: ShippingCommodity[];
  }): Promise<{
    shippingCost: number;
    serviceName: string;
    estimatedDelivery: string;
    rateType?: "ACCOUNT";
    currency?: "IDR";
    totalDeclaredValue?: number;
    totalWeightKg?: number;
  }>;
}

export interface PaymentGateway {
  createSnapTransaction(input: {
    midtransOrderId: string;
    grossAmount: number;
    customer: { name: string; phone: string };
    itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<{ token: string; redirectUrl: string }>;
}

export interface CreateCheckoutIntentInput {
  userId: string;
  idempotencyKey: string;
  addressId: string;
  note: string;
  items: CheckoutItemInput[];
}

export interface CheckoutIntentResult {
  orderId: string;
  midtransOrderId: string;
  snapToken: string;
  redirectUrl: string;
  reused: boolean;
  expiresAt: string;
}

export class CheckoutIntentInProgressError extends Error {
  constructor() {
    super("Checkout is already being prepared. Please retry in a moment.");
  }
}

export class CheckoutIntentConflictError extends Error {
  constructor() {
    super("This checkout session no longer matches the cart. Refresh the checkout page and try again.");
  }
}

export class DuplicateCheckoutRequestError extends Error {
  constructor() {
    super("Duplicate checkout request.");
  }
}

export async function createCheckoutIntent(
  input: CreateCheckoutIntentInput,
  deps: {
    repository: CheckoutRepository;
    shipping: ShippingRateProvider;
    paymentGateway: PaymentGateway;
    now?: () => Date;
    createOrderId?: () => string;
  },
): Promise<CheckoutIntentResult> {
  const now = deps.now?.() ?? new Date();
  const existing = await deps.repository.findOrderByIdempotency(input.userId, input.idempotencyKey);

  if (existing?.snapToken && existing.snapRedirectUrl && existing.snapTokenExpiresAt) {
    const expiresAt = new Date(existing.snapTokenExpiresAt);
    if (expiresAt > now) {
      return {
        orderId: existing.id,
        midtransOrderId: existing.midtransOrderId,
        snapToken: existing.snapToken,
        redirectUrl: existing.snapRedirectUrl,
        reused: true,
        expiresAt: expiresAt.toISOString(),
      };
    }
    throw new CheckoutIntentConflictError();
  }

  if (existing && !existing.snapToken) {
    throw new CheckoutIntentInProgressError();
  }

  const normalizedItems = normalizeCheckoutItems(input.items);
  const address = await deps.repository.getAddressForUser(input.userId, input.addressId);
  if (!address) {
    throw new Error("Address not found.");
  }

  const products = await deps.repository.getProductsByIds(normalizedItems.map((item) => item.productId));
  const pricedItems = priceCheckoutItems(normalizedItems, products);
  calculateCheckoutPricing(pricedItems, 0);
  const shippingRate = await deps.shipping.getShippingRate({
    destination: {
      postalCode: address.postalCode,
      countryCode: address.countryCode,
    },
    commodities: buildShippingCommodities(pricedItems),
  });
  const pricing = calculateCheckoutPricing(pricedItems, shippingRate.shippingCost);
  const cartFingerprint = createCartFingerprint({
    addressId: input.addressId,
    items: normalizedItems,
    pricing,
  });

  if (existing?.cartFingerprint && existing.cartFingerprint !== cartFingerprint) {
    throw new CheckoutIntentConflictError();
  }

  const orderId = deps.createOrderId?.() ?? crypto.randomUUID();
  let created: CreatedCheckoutOrder;
  try {
    created = await deps.repository.createPendingOrder({
      id: orderId,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      cartFingerprint,
      address,
      items: pricedItems.map((item) => ({
        productId: item.product.id,
        productVariantId: item.variant?.id ?? null,
        quantity: item.quantity,
        priceRaw: item.unitPriceRaw,
        price: item.price,
        customAmountRaw: item.customAmountRaw ?? null,
        purchaseDescriptionSnapshot: item.purchaseDescription ?? null,
        sourceSnapshot: item.sourceSnapshot,
      })),
      pricing,
      note: input.note,
      cartSnapshot: pricedItems.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        variant_id: item.variant?.id ?? null,
        variant_name: item.variant?.name ?? null,
        quantity: item.quantity,
        price_raw: item.unitPriceRaw,
        custom_amount_raw: item.customAmountRaw ?? null,
        weight_kg: item.lineWeightKg / item.quantity,
        purchase_description: item.purchaseDescription ?? null,
        source: item.sourceSnapshot,
      })),
      shippingSnapshot: shippingRate,
    });
  } catch (error) {
    if (error instanceof DuplicateCheckoutRequestError) {
      const duplicate = await deps.repository.findOrderByIdempotency(input.userId, input.idempotencyKey);
      if (duplicate?.snapToken && duplicate.snapRedirectUrl && duplicate.snapTokenExpiresAt) {
        return {
          orderId: duplicate.id,
          midtransOrderId: duplicate.midtransOrderId,
          snapToken: duplicate.snapToken,
          redirectUrl: duplicate.snapRedirectUrl,
          reused: true,
          expiresAt: duplicate.snapTokenExpiresAt,
        };
      }
      throw new CheckoutIntentInProgressError();
    }
    throw error;
  }

  const expiresAt = new Date(now.getTime() + SNAP_TOKEN_TTL_MS);
  const snap = await deps.paymentGateway.createSnapTransaction({
    midtransOrderId: created.midtransOrderId,
    grossAmount: pricing.grandTotal,
    customer: { name: address.name, phone: address.phone },
    itemDetails: buildMidtransItemDetails(pricedItems, pricing),
    expiresAt,
    createdAt: now,
  });

  await deps.repository.attachSnapToken({
    orderId: created.id,
    token: snap.token,
    redirectUrl: snap.redirectUrl,
    expiresAt,
  });

  return {
    orderId: created.id,
    midtransOrderId: created.midtransOrderId,
    snapToken: snap.token,
    redirectUrl: snap.redirectUrl,
    reused: false,
    expiresAt: expiresAt.toISOString(),
  };
}
