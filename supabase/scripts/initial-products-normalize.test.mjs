import { describe, expect, it } from "vitest";
import {
  CUSTOM_BOX_PURCHASE_INSTRUCTIONS,
  customBoxProduct,
  normalizeIndogrosirPayload,
  normalizeZaloraPayload,
} from "./initial-products-normalize.mjs";

const SOURCE_FIELDS = [
  "source_provider",
  "source_product_id",
  "source_url",
  "source_query",
  "source_metadata",
  "image_source_url",
  "purchase_description",
];

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

    expect(product.bootstrap_key).toMatch(/^initial:[a-f0-9]{16}$/);
    expect(product.category).toBe("Instant Noodles");
    expect(product.price_raw).toBe(3500);
    expect(product.stock).toBe(1000);
    expect(product.weight_kg).toBeCloseTo(0.085);
    expect(product.description).toBe("INDOMIE GORENG 85g");
    expect(product.purchase_instructions).toBeNull();
    expect(product.image_object_path).toMatch(/^initial\/[a-f0-9]{16}\.webp$/);
    for (const field of SOURCE_FIELDS) {
      expect(product).not.toHaveProperty(field);
    }
    expect(product.specifications).not.toHaveProperty("Source");
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

    expect(product.bootstrap_key).toMatch(/^initial:[a-f0-9]{16}$/);
    expect(product.category).toBe("Fashion");
    expect(product.price_raw).toBe(199000);
    expect(product.stock).toBe(1000);
    expect(product.description).toBe("Batik Shirt");
    expect(product.purchase_instructions).toBeNull();
    expect(product.image_object_path).toMatch(/^initial\/[a-f0-9]{16}\.webp$/);
    for (const field of SOURCE_FIELDS) {
      expect(product).not.toHaveProperty(field);
    }
    expect(product.specifications).not.toHaveProperty("Source");
  });

  it("creates custom box as custom amount product", () => {
    const product = customBoxProduct();
    expect(product.pricing_type).toBe("custom_amount");
    expect(product.min_price_raw).toBe(500000);
    expect(product.max_price_raw).toBe(10000000);
    expect(product.weight_kg).toBe(21);
    expect(product.stock).toBe(1000);
    expect(product.bootstrap_key).toMatch(/^initial:[a-f0-9]{16}$/);
    expect(product.image_object_path).toMatch(/^initial\/[a-f0-9]{16}\.jpg$/);
    expect(product.purchase_instructions).toBe(CUSTOM_BOX_PURCHASE_INSTRUCTIONS);
    for (const field of SOURCE_FIELDS) {
      expect(product).not.toHaveProperty(field);
    }
  });
});
