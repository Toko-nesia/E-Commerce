import { describe, expect, it } from "vitest";
import {
  buildFedExCommodities,
  buildFedExRateRequest,
  buildFedExTransitTimesRequest,
  summarizeShippingCommodities,
} from "@/lib/fedex/service";
import type { ShippingCommodity } from "@/domain/checkout";

const commodities: ShippingCommodity[] = [
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
  {
    productId: 2,
    name: "Keripik Balado",
    category: "Snacks",
    quantity: 1,
    unitPriceIdr: 50_000,
    lineValueIdr: 50_000,
    unitWeightKg: 5,
    lineWeightKg: 5,
    countryOfManufacture: "ID",
  },
];

describe("FedEx shipping payload builders", () => {
  it("summarizes declared value and total weight from checkout commodities", () => {
    expect(summarizeShippingCommodities(commodities)).toEqual({
      totalDeclaredValue: 250_000,
      totalWeightKg: 29,
    });
  });

  it("builds customs commodities from product data without hardcoded values", () => {
    expect(buildFedExCommodities(commodities)).toEqual([
      expect.objectContaining({
        description: "Kopi Aceh - Coffee",
        countryOfManufacture: "ID",
        quantity: 2,
        quantityUnits: "PCS",
        weight: { units: "KG", value: 24 },
        unitPrice: { amount: 100_000, currency: "IDR" },
        customsValue: { amount: 200_000, currency: "IDR" },
      }),
      expect.objectContaining({
        description: "Keripik Balado - Snacks",
        weight: { units: "KG", value: 5 },
        unitPrice: { amount: 50_000, currency: "IDR" },
        customsValue: { amount: 50_000, currency: "IDR" },
      }),
    ]);
  });

  it("requests only ACCOUNT rates and omits package dimensions", () => {
    const request = buildFedExRateRequest({
      accountNumber: "123456789",
      origin: { postalCode: "65143", countryCode: "ID" },
      destination: { postalCode: "1000001", countryCode: "JP" },
      shipDate: "2026-05-14",
      commodities,
    });

    expect(request.requestedShipment.rateRequestType).toEqual(["ACCOUNT"]);
    expect(request.requestedShipment.requestedPackageLineItems).toEqual([
      { weight: { units: "KG", value: 29 } },
    ]);
    expect(JSON.stringify(request)).not.toContain("\"LIST\"");
    expect(JSON.stringify(request)).not.toContain("\"dimensions\"");
    expect(request.requestedShipment.customsClearanceDetail.commodities[0].customsValue).toEqual({
      amount: 200_000,
      currency: "IDR",
    });
  });

  it("uses the same customs payload for transit fallback", () => {
    const request = buildFedExTransitTimesRequest({
      origin: { postalCode: "65143", countryCode: "ID" },
      destination: { postalCode: "1000001", countryCode: "JP" },
      shipDate: "2026-05-14",
      commodities,
    });

    expect(JSON.stringify(request)).not.toContain("\"USD\"");
    expect(JSON.stringify(request)).not.toContain("\"dimensions\"");
    for (const commodity of request.requestedShipment.customsClearanceDetail.commodities) {
      expect(commodity.unitPrice.amount).not.toBe(1);
      expect(commodity.customsValue.amount).not.toBe(1);
    }
    expect(request.requestedShipment.customsClearanceDetail.commodities[1].description).toBe(
      "Keripik Balado - Snacks",
    );
  });
});
