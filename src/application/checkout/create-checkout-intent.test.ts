import { describe, expect, it, vi } from "vitest";
import {
  CheckoutIntentConflictError,
  CheckoutIntentInProgressError,
  DuplicateCheckoutRequestError,
  createCheckoutIntent,
  type CheckoutAddress,
  type CheckoutRepository,
  type ExistingCheckoutOrder,
  type PaymentGateway,
  type ShippingRateProvider,
} from "@/application/checkout/create-checkout-intent";
import type { CheckoutProduct } from "@/domain/checkout";

const now = new Date("2026-05-14T00:00:00.000Z");

const address: CheckoutAddress = {
  id: "addr-1",
  userId: "user-1",
  name: "Haruka",
  phone: "0800000000",
  address: "Tokyo",
  fullAddress: "Tokyo, Japan",
  details: "Apt 1",
  postalCode: "1000001",
  countryCode: "JP",
};

const product: CheckoutProduct = {
  id: 1,
  name: "Kopi Aceh",
  category: "Coffee",
  price: "Rp100.000",
  priceRaw: 100_000,
  stock: 10,
  weightKg: 24,
};

function createDeps(options: {
  existing?: ExistingCheckoutOrder | null;
  createError?: Error;
  duplicateAfterCreate?: ExistingCheckoutOrder | null;
} = {}) {
  let lookupCount = 0;
  const createdOrders: unknown[] = [];

  const repository: CheckoutRepository = {
    findOrderByIdempotency: vi.fn(async () => {
      lookupCount += 1;
      if (lookupCount > 1 && options.duplicateAfterCreate !== undefined) {
        return options.duplicateAfterCreate;
      }
      return options.existing ?? null;
    }),
    getAddressForUser: vi.fn(async () => address),
    getProductsByIds: vi.fn(async () => [product]),
    createPendingOrder: vi.fn(async (input) => {
      if (options.createError) {
        throw options.createError;
      }
      createdOrders.push(input);
      return { id: input.id, midtransOrderId: "ZB-ORDER-1" };
    }),
    attachSnapToken: vi.fn(async () => undefined),
  };

  const shipping: ShippingRateProvider = {
    getShippingRate: vi.fn(async () => ({
      shippingCost: 25_000,
      serviceName: "FedEx International Priority",
      estimatedDelivery: "3-5 business days",
    })),
  };

  const paymentGateway: PaymentGateway = {
    createSnapTransaction: vi.fn(async () => ({
      token: "snap-token",
      redirectUrl: "https://snap.midtrans.test/redirect",
    })),
  };

  return { repository, shipping, paymentGateway, createdOrders };
}

const input = {
  userId: "user-1",
  idempotencyKey: "checkout-key",
  addressId: "addr-1",
  note: "Careful packing",
  items: [{ productId: 1, quantity: 1 }],
};

describe("createCheckoutIntent", () => {
  it("reuses an unexpired Snap token for the same idempotency key", async () => {
    const deps = createDeps({
      existing: {
        id: "order-1",
        midtransOrderId: "ZB-1",
        idempotencyKey: "checkout-key",
        cartFingerprint: "fingerprint",
        snapToken: "existing-token",
        snapRedirectUrl: "https://snap.midtrans.test/existing",
        snapTokenExpiresAt: "2026-05-15T00:00:00.000Z",
      },
    });

    const result = await createCheckoutIntent(input, { ...deps, now: () => now });

    expect(result.reused).toBe(true);
    expect(result.snapToken).toBe("existing-token");
    expect(deps.repository.createPendingOrder).not.toHaveBeenCalled();
    expect(deps.paymentGateway.createSnapTransaction).not.toHaveBeenCalled();
  });

  it("rejects an expired checkout session instead of returning an expired token", async () => {
    const deps = createDeps({
      existing: {
        id: "order-1",
        midtransOrderId: "ZB-1",
        idempotencyKey: "checkout-key",
        cartFingerprint: "fingerprint",
        snapToken: "expired-token",
        snapRedirectUrl: "https://snap.midtrans.test/expired",
        snapTokenExpiresAt: "2026-05-13T00:00:00.000Z",
      },
    });

    await expect(createCheckoutIntent(input, { ...deps, now: () => now })).rejects.toBeInstanceOf(
      CheckoutIntentConflictError,
    );
  });

  it("treats a duplicate insert race as in progress until the first token is attached", async () => {
    const deps = createDeps({
      createError: new DuplicateCheckoutRequestError(),
      duplicateAfterCreate: {
        id: "order-1",
        midtransOrderId: "ZB-1",
        idempotencyKey: "checkout-key",
        cartFingerprint: "fingerprint",
        snapToken: null,
        snapRedirectUrl: null,
        snapTokenExpiresAt: null,
      },
    });

    await expect(createCheckoutIntent(input, { ...deps, now: () => now })).rejects.toBeInstanceOf(
      CheckoutIntentInProgressError,
    );
  });

  it("creates a pending order from server-side product, address, and shipping data", async () => {
    const deps = createDeps();

    const result = await createCheckoutIntent(input, {
      ...deps,
      now: () => now,
      createOrderId: () => "order-1",
    });

    expect(result).toMatchObject({
      orderId: "order-1",
      midtransOrderId: "ZB-ORDER-1",
      snapToken: "snap-token",
      reused: false,
    });
    expect(deps.repository.createPendingOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "order-1",
        userId: "user-1",
        idempotencyKey: "checkout-key",
        address,
        pricing: expect.objectContaining({
          subtotal: 100_000,
          shippingCost: 25_000,
          serviceFee: 1_000,
          grandTotal: 126_000,
        }),
      }),
    );
    expect(deps.paymentGateway.createSnapTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        midtransOrderId: "ZB-ORDER-1",
        grossAmount: 126_000,
      }),
    );
  });
});
