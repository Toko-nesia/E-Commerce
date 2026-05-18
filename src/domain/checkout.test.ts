import { describe, expect, it } from "vitest";
import {
  buildMidtransItemDetails,
  buildShippingCommodities,
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
    category: "Coffee",
    price: "Rp100.000",
    priceRaw: 100_000,
    stock: 10,
    weightKg: 12,
  },
  {
    id: 2,
    name: "Keripik Balado",
    category: "Snacks",
    price: "Rp50.000",
    priceRaw: 50_000,
    stock: 10,
    weightKg: 5,
  },
  {
    id: 3,
    name: "Custom Box Jastip 21kg",
    category: "Jastip Box",
    price: "From Rp500.000",
    priceRaw: 500_000,
    stock: 999,
    weightKg: 21,
    pricingType: "custom_amount",
    minPriceRaw: 500_000,
    maxPriceRaw: 10_000_000,
  },
  {
    id: 4,
    name: "Sepatu Casual",
    category: "Shoes",
    price: "Rp300.000",
    priceRaw: 300_000,
    stock: 0,
    weightKg: 1.5,
    pricingType: "variant",
    variants: [
      {
        id: 41,
        productId: 4,
        name: "EU 40",
        price: "Rp350.000",
        priceRaw: 350_000,
        stock: 3,
        weightKg: 2,
      },
      {
        id: 42,
        productId: 4,
        name: "EU 41",
        price: "Rp375.000",
        priceRaw: 375_000,
        stock: 1,
        weightKg: 2,
      },
    ],
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
      { productId: 1, variantId: null, customAmountRaw: null, buyerNote: null, quantity: 2 },
      { productId: 2, variantId: null, customAmountRaw: null, buyerNote: null, quantity: 4 },
    ]);
  });

  it("preserves buyer item notes and rejects conflicting duplicate notes", () => {
    expect(
      normalizeCheckoutItems([
        { productId: 1, quantity: 1, buyerNote: "  Medium roast only  " },
        { productId: 1, quantity: 1, buyerNote: "Medium roast only" },
      ]),
    ).toEqual([
      { productId: 1, variantId: null, customAmountRaw: null, buyerNote: "Medium roast only", quantity: 2 },
    ]);

    expect(() =>
      normalizeCheckoutItems([
        { productId: 1, quantity: 1, buyerNote: "Size M" },
        { productId: 1, quantity: 1, buyerNote: "Size L" },
      ]),
    ).toThrow("conflicting notes");

    expect(() =>
      normalizeCheckoutItems([{ productId: 1, quantity: 1, buyerNote: "x".repeat(2001) }]),
    ).toThrow("Item note must be 2000 characters or less.");
  });

  it("keeps variant and custom amount selections as separate cart lines", () => {
    expect(
      normalizeCheckoutItems([
        { productId: 4, variantId: 42, quantity: 1 },
        { productId: 4, variantId: 41, quantity: 1 },
        { productId: 3, customAmountRaw: 500_000, quantity: 1 },
        { productId: 3, customAmountRaw: 750_000, quantity: 1 },
        { productId: 3, customAmountRaw: 500_000, quantity: 2 },
      ]),
    ).toEqual([
      { productId: 3, variantId: null, customAmountRaw: 500_000, buyerNote: null, quantity: 3 },
      { productId: 3, variantId: null, customAmountRaw: 750_000, buyerNote: null, quantity: 1 },
      { productId: 4, variantId: 41, customAmountRaw: null, buyerNote: null, quantity: 1 },
      { productId: 4, variantId: 42, customAmountRaw: null, buyerNote: null, quantity: 1 },
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

  it("prices variants from the selected variant, not the parent product", () => {
    const priced = priceCheckoutItems([{ productId: 4, variantId: 42, quantity: 1 }], products);

    expect(priced[0]).toMatchObject({
      unitPriceRaw: 375_000,
      price: "Rp375.000",
      lineTotal: 375_000,
      lineWeightKg: 2,
      variant: expect.objectContaining({ id: 42, name: "EU 41" }),
    });
    expect(() => priceCheckoutItems([{ productId: 4, variantId: 42, quantity: 2 }], products)).toThrow(
      "Insufficient stock",
    );
  });

  it("validates and prices custom amount products from the submitted amount", () => {
    const priced = priceCheckoutItems([{ productId: 3, customAmountRaw: 750_000, quantity: 1 }], products);

    expect(priced[0]).toMatchObject({
      unitPriceRaw: 750_000,
      price: "Rp750.000",
      lineTotal: 750_000,
      lineWeightKg: 21,
      customAmountRaw: 750_000,
    });
    expect(() => priceCheckoutItems([{ productId: 3, customAmountRaw: 499_999, quantity: 1 }], products)).toThrow(
      "budget must be between Rp500.000 and Rp10.000.000",
    );
    expect(() => priceCheckoutItems([{ productId: 3, customAmountRaw: 10_000_001, quantity: 1 }], products)).toThrow(
      "budget must be between Rp500.000 and Rp10.000.000",
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

  it("builds unique Midtrans ids for different custom amount lines", () => {
    const priced = priceCheckoutItems(
      [
        { productId: 3, customAmountRaw: 500_000, quantity: 1 },
        { productId: 3, customAmountRaw: 750_000, quantity: 1 },
      ],
      products,
    );
    const pricing = calculateCheckoutPricing(priced, 30_000);
    const itemDetails = buildMidtransItemDetails(priced, pricing);

    expect(itemDetails.map((item) => item.id)).toEqual([
      "3-custom-500000",
      "3-custom-750000",
      "SHIPPING",
      "SERVICE_FEE",
    ]);
  });

  it("builds shipping commodities from priced checkout items", () => {
    const priced = priceCheckoutItems([{ productId: 1, quantity: 2 }], products);

    expect(buildShippingCommodities(priced)).toEqual([
      {
        productId: 1,
        name: "Kopi Aceh",
        category: "Coffee",
        quantity: 2,
        unitPriceIdr: 100_000,
        lineValueIdr: 200_000,
        unitWeightKg: 12,
        lineWeightKg: 24,
        countryOfManufacture: "ID",
      },
    ]);
  });
});
