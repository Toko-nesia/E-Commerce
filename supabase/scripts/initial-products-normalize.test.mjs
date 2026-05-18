import { describe, expect, it } from "vitest";
import {
  customBoxProduct,
  normalizeIndogrosirPayload,
  normalizeZaloraPayload,
} from "./initial-products-normalize.mjs";

describe("initial product normalization", () => {
  it("normalizes Indogrosir products", () => {
    const [product] = normalizeIndogrosirPayload({
      product_details: [{
        prdcd: "001",
        long_description: "INDOMIE GORENG 85g",
        hrg_jual: 3500,
        unit: "PCS",
        frac: 1,
        min_jual: 1,
        isAvailable: 1,
        url_pic_prod: "https://example.com/indomie.png",
        pricelist: [],
      }],
    }, { query: "mie instant" });

    expect(product.bootstrap_key).toBe("indogrosir:001");
    expect(product.category).toBe("Instant Noodles");
    expect(product.price_raw).toBe(3500);
    expect(product.weight_kg).toBeCloseTo(0.085);
    expect(product.purchase_description).toContain("Source link:");
  });

  it("normalizes Zalora products", () => {
    const [product] = normalizeZaloraPayload({
      data: {
        Products: [{
          ConfigSku: "SKU-1",
          Name: "Batik Shirt",
          PriceInDecimal: 250000,
          SpecialPriceInDecimal: 199000,
          Brand: "Brand",
          MainImageUrl: "https://example.com/batik.webp",
          Breadcrumbs: ["Pria", "Pakaian"],
          ProductUrl: "p/brand-batik-shirt-1",
        }],
      },
    }, { query: "pakaian" });

    expect(product.bootstrap_key).toBe("zalora:SKU-1");
    expect(product.category).toBe("Fashion");
    expect(product.price_raw).toBe(199000);
    expect(product.source_url).toBe("https://www.zalora.co.id/p/brand-batik-shirt-1");
  });

  it("creates custom box as custom amount product", () => {
    const product = customBoxProduct();
    expect(product.pricing_type).toBe("custom_amount");
    expect(product.min_price_raw).toBe(500000);
    expect(product.max_price_raw).toBe(10000000);
    expect(product.weight_kg).toBe(21);
  });
});
