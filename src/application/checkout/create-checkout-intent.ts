import {
  SNAP_TOKEN_TTL_MS,
  buildMidtransItemDetails,
  calculateCheckoutPricing,
  createCartFingerprint,
  formatRp,
  normalizeCheckoutItems,
  priceCheckoutItems,
  type CheckoutItemInput,
  type CheckoutPricing,
  type CheckoutProduct,
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
    quantity: number;
    priceRaw: number;
    price: string;
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
    postalCode: string;
    countryCode: string;
    totalWeightKg: number;
  }): Promise<{
    shippingCost: number;
    serviceName: string;
    estimatedDelivery: string;
  }>;
}

export interface PaymentGateway {
  createSnapTransaction(input: {
    midtransOrderId: string;
    grossAmount: number;
    customer: { name: string; phone: string };
    itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
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
  const weightOnlyPricing = calculateCheckoutPricing(pricedItems, 0);
  const shippingRate = await deps.shipping.getShippingRate({
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    totalWeightKg: weightOnlyPricing.totalWeightKg,
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
        quantity: item.quantity,
        priceRaw: item.product.priceRaw,
        price: formatRp(item.product.priceRaw),
      })),
      pricing,
      note: input.note,
      cartSnapshot: pricedItems.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price_raw: item.product.priceRaw,
        weight_kg: item.product.weightKg,
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

  const snap = await deps.paymentGateway.createSnapTransaction({
    midtransOrderId: created.midtransOrderId,
    grossAmount: pricing.grandTotal,
    customer: { name: address.name, phone: address.phone },
    itemDetails: buildMidtransItemDetails(pricedItems, pricing),
  });
  const expiresAt = new Date(now.getTime() + SNAP_TOKEN_TTL_MS);

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
