import { describe, expect, it, vi } from "vitest";
import { estimateShippingRate } from "@/application/shipping/estimate-shipping-rate";
import { shippingRateRequestSchema } from "@/application/shipping/schemas";
import type {
  CheckoutAddress,
  CheckoutRepository,
  ShippingRateProvider,
} from "@/application/checkout/create-checkout-intent";
import type { CheckoutProduct } from "@/domain/checkout";

const address: CheckoutAddress = {
  id: "11111111-1111-4111-8111-111111111111",
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

function createDeps(overrides: {
  address?: CheckoutAddress | null;
  products?: CheckoutProduct[];
} = {}) {
  const addressResult = Object.hasOwn(overrides, "address") ? overrides.address! : address;
  const repository: CheckoutRepository = {
    findOrderByIdempotency: vi.fn(async () => null),
    getAddressForUser: vi.fn(async () => addressResult),
    getProductsByIds: vi.fn(async () => overrides.products ?? [product]),
    createPendingOrder: vi.fn(),
    attachSnapToken: vi.fn(),
  };
  const shipping: ShippingRateProvider = {
    getShippingRate: vi.fn(async () => ({
      shippingCost: 25_000,
      serviceName: "FedEx International Economy",
      estimatedDelivery: "Thursday, May 21, 2026",
      rateType: "ACCOUNT" as const,
      currency: "IDR" as const,
      totalDeclaredValue: 100_000,
      totalWeightKg: 24,
    })),
  };
  return { repository, shipping };
}

describe("estimateShippingRate", () => {
  it("rejects the legacy client-computed shipping payload", () => {
    expect(
      shippingRateRequestSchema.safeParse({
        postalCode: "1000001",
        countryCode: "JP",
        totalWeightKg: 24,
      }).success,
    ).toBe(false);
  });

  it("builds shipping input from server-side address and product data", async () => {
    const deps = createDeps();

    await estimateShippingRate(
      {
        userId: "user-1",
        addressId: address.id,
        items: [{ productId: 1, quantity: 1 }],
      },
      deps,
    );

    expect(deps.repository.getAddressForUser).toHaveBeenCalledWith("user-1", address.id);
    expect(deps.shipping.getShippingRate).toHaveBeenCalledWith({
      destination: { postalCode: "1000001", countryCode: "JP" },
      commodities: [
        {
          productId: 1,
          name: "Kopi Aceh",
          category: "Coffee",
          quantity: 1,
          unitPriceIdr: 100_000,
          lineValueIdr: 100_000,
          unitWeightKg: 24,
          lineWeightKg: 24,
          countryOfManufacture: "ID",
        },
      ],
    });
  });

  it("rejects addresses that are not available for the authenticated user", async () => {
    const deps = createDeps({ address: null });

    await expect(
      estimateShippingRate(
        {
          userId: "user-1",
          addressId: address.id,
          items: [{ productId: 1, quantity: 1 }],
        },
        deps,
      ),
    ).rejects.toThrow("Address not found");
  });

  it("rejects invalid product weight before calling FedEx", async () => {
    const deps = createDeps({ products: [{ ...product, weightKg: 0 }] });

    await expect(
      estimateShippingRate(
        {
          userId: "user-1",
          addressId: address.id,
          items: [{ productId: 1, quantity: 1 }],
        },
        deps,
      ),
    ).rejects.toThrow("Invalid weight");
    expect(deps.shipping.getShippingRate).not.toHaveBeenCalled();
  });
});
