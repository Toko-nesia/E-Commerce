import { describe, expect, it } from "vitest";
import {
  buildMidtransItemDetails,
  calculateCheckoutPricing,
  createCartFingerprint,
  normalizeCheckoutItems,
  priceCheckoutItems,
  type CheckoutProduct,
} from "@/domain/checkout";

const products: CheckoutProduct[] = [
  {
    id: 1,
    name: "Kopi Aceh",
    price: "Rp100.000",
    priceRaw: 100_000,
    stock: 10,
    weightKg: 12,
  },
  {
    id: 2,
    name: "Keripik Balado",
    price: "Rp50.000",
    priceRaw: 50_000,
    stock: 10,
    weightKg: 5,
  },
];

describe("checkout domain", () => {
  it("normalizes duplicate cart lines deterministically", () => {
    expect(
      normalizeCheckoutItems([
        { productId: 2, quantity: 1 },
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 3 },
      ]),
    ).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 4 },
    ]);
  });

  it("prices cart items from product records and rejects oversell", () => {
    const priced = priceCheckoutItems([{ productId: 1, quantity: 2 }], products);

    expect(priced[0].lineTotal).toBe(200_000);
    expect(priced[0].lineWeightKg).toBe(24);
    expect(() => priceCheckoutItems([{ productId: 1, quantity: 99 }], products)).toThrow(
      "Insufficient stock",
    );
  });

  it("enforces the checkout minimum weight before payment is created", () => {
    const tooLight = priceCheckoutItems([{ productId: 2, quantity: 1 }], products);

    expect(() => calculateCheckoutPricing(tooLight, 25_000)).toThrow("Minimum order weight");
  });

  it("creates a stable fingerprint from normalized items and server pricing", () => {
    const one = [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 2 },
    ];
    const two = [
      { productId: 2, quantity: 2 },
      { productId: 1, quantity: 1 },
    ];
    const pricing = calculateCheckoutPricing(priceCheckoutItems(one, products), 30_000);

    expect(createCartFingerprint({ addressId: "addr-1", items: two, pricing })).toBe(
      createCartFingerprint({ addressId: "addr-1", items: one, pricing }),
    );
  });

  it("builds Midtrans item details whose sum matches gross amount", () => {
    const priced = priceCheckoutItems([{ productId: 1, quantity: 2 }], products);
    const pricing = calculateCheckoutPricing(priced, 30_000);
    const itemDetails = buildMidtransItemDetails(priced, pricing);
    const grossAmount = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);

    expect(grossAmount).toBe(pricing.grandTotal);
  });
});
