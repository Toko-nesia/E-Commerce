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
} from "@/domain/checkout";
import {
  buildShippingRateOptions,
  normalizeShippingMethodCode,
  type ExternalShippingRateProvider,
  type ShippingMethodCode,
  type ShippingMethodConfig,
} from "@/domain/shipping";

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
  status: string;
  paymentStatus: string;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  snapTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
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
    customAmountRaw?: number | null;
    buyerNote?: string | null;
  }>;
  pricing: CheckoutPricing;
  note: string;
  cartSnapshot: unknown;
  shippingSnapshot: unknown;
  paymentMethod: "bank_transfer" | "credit_card";
  shippingMethod: ShippingMethodCode;
}

export interface CheckoutRepository {
  findOrderByIdempotency(userId: string, idempotencyKey: string): Promise<ExistingCheckoutOrder | null>;
  getAddressForUser(userId: string, addressId: string): Promise<CheckoutAddress | null>;
  getProductsByIds(productIds: number[]): Promise<CheckoutProduct[]>;
  getShippingMethods(): Promise<ShippingMethodConfig[]>;
  createPendingOrder(input: CreateCheckoutOrderInput): Promise<CreatedCheckoutOrder>;
  attachSnapToken(input: {
    orderId: string;
    token: string;
    redirectUrl: string;
    expiresAt: Date;
  }): Promise<void>;
  markPaymentSetupFailed(input: {
    orderId: string;
    reason: string;
    failedAt: Date;
  }): Promise<void>;
}

export type ShippingRateProvider = ExternalShippingRateProvider;

export interface PaymentGateway {
  createSnapTransaction(input: {
    midtransOrderId: string;
    grossAmount: number;
    paymentMethod: "bank_transfer" | "credit_card";
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
  shippingMethod: ShippingMethodCode;
  paymentMethod: "bank_transfer" | "credit_card";
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

const CHECKOUT_INTENT_PREPARATION_TIMEOUT_MS = 5 * 60 * 1000;

function isSnaplessPendingCheckoutStale(existing: ExistingCheckoutOrder, now: Date): boolean {
  if (existing.snapToken || existing.paymentStatus !== "pending" || existing.status !== "PAYMENT_PENDING") {
    return false;
  }

  const lastTouchedAt = new Date(existing.updatedAt || existing.createdAt);
  return Number.isFinite(lastTouchedAt.getTime())
    && now.getTime() - lastTouchedAt.getTime() >= CHECKOUT_INTENT_PREPARATION_TIMEOUT_MS;
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
    if (isSnaplessPendingCheckoutStale(existing, now)) {
      await deps.repository.markPaymentSetupFailed({
        orderId: existing.id,
        reason: "payment_setup_stale",
        failedAt: now,
      });
    } else {
      throw new CheckoutIntentInProgressError();
    }
  }

  if (existing && !existing.snapToken && !isSnaplessPendingCheckoutStale(existing, now)) {
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
  const shippingMethod = normalizeShippingMethodCode(input.shippingMethod);
  const shippingMethods = await deps.repository.getShippingMethods();
  const selectedShippingMethods = shippingMethods.filter((method) => method.code === shippingMethod);
  const { rates, warnings } = await buildShippingRateOptions({
    methods: selectedShippingMethods,
    destination: {
      postalCode: address.postalCode,
      countryCode: address.countryCode,
    },
    commodities: buildShippingCommodities(pricedItems),
    fedex: deps.shipping,
  });
  const shippingRate = rates.find((rate) => rate.method === shippingMethod);
  if (!shippingRate) {
    if (!selectedShippingMethods.some((method) => method.enabled)) {
      throw new Error("Selected shipping method is not available.");
    }
    throw new Error(warnings[0] ?? "Selected shipping method is unavailable.");
  }
  const pricing = calculateCheckoutPricing(pricedItems, shippingRate.shippingCost);
  const cartFingerprint = createCartFingerprint({
    addressId: input.addressId,
    shippingMethod,
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
        priceRaw: item.unitPriceRaw,
        price: item.price,
        customAmountRaw: item.customAmountRaw ?? null,
        buyerNote: item.buyerNote ?? null,
      })),
      pricing,
      note: input.note,
      cartSnapshot: pricedItems.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price_raw: item.unitPriceRaw,
        custom_amount_raw: item.customAmountRaw ?? null,
        weight_kg: item.lineWeightKg / item.quantity,
        buyer_note: item.buyerNote ?? null,
      })),
      shippingSnapshot: shippingRate.snapshot,
      paymentMethod: input.paymentMethod,
      shippingMethod,
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
  let snap: { token: string; redirectUrl: string };
  try {
    snap = await deps.paymentGateway.createSnapTransaction({
      midtransOrderId: created.midtransOrderId,
      grossAmount: pricing.grandTotal,
      paymentMethod: input.paymentMethod,
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
  } catch (error) {
    await deps.repository.markPaymentSetupFailed({
      orderId: created.id,
      reason: "payment_setup_failed",
      failedAt: deps.now?.() ?? new Date(),
    });
    throw error;
  }

  return {
    orderId: created.id,
    midtransOrderId: created.midtransOrderId,
    snapToken: snap.token,
    redirectUrl: snap.redirectUrl,
    reused: false,
    expiresAt: expiresAt.toISOString(),
  };
}
