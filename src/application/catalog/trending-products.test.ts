import { describe, expect, it } from "vitest";
import {
  calculateTrendingScore,
  rankTrendingProducts,
  normalizeTrendingProductsInput,
  type TrendingSaleSignal,
} from "@/application/catalog/trending-products";
import type { Product } from "@/types/database";

const now = new Date("2026-05-15T00:00:00.000Z");

function product(input: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    id: input.id,
    name: input.name,
    category: input.category ?? "Snacks",
    price: input.price ?? "Rp100.000",
    price_raw: input.price_raw ?? 100_000,
    badge: input.badge ?? null,
    badge_color: input.badge_color ?? null,
    image: input.image ?? "/products/test.png",
    stock: input.stock ?? 10,
    weight_kg: input.weight_kg ?? 1,
    created_at: input.created_at ?? "2026-05-01T00:00:00.000Z",
    updated_at: input.updated_at ?? "2026-05-01T00:00:00.000Z",
  };
}

function sale(input: Partial<TrendingSaleSignal> & { product: Product }): TrendingSaleSignal {
  return {
    product: input.product,
    quantity: input.quantity ?? 1,
    priceRaw: input.priceRaw ?? input.product.price_raw,
    paidAt: input.paidAt ?? "2026-05-14T00:00:00.000Z",
    paymentStatus: input.paymentStatus ?? "settlement",
    orderStatus: input.orderStatus ?? "DIPROSES",
  };
}

describe("trending products", () => {
  it("normalizes limit safely", () => {
    expect(normalizeTrendingProductsInput({ limit: -5, now }).limit).toBe(1);
    expect(normalizeTrendingProductsInput({ limit: 99, now }).limit).toBe(20);
    expect(normalizeTrendingProductsInput({ limit: 4.8, now }).limit).toBe(4);
  });

  it("uses a 14-day half-life so recent sales outrank stale sales", () => {
    const recentScore = calculateTrendingScore({
      quantity: 1,
      lineRevenueIdr: 100_000,
      paidAt: "2026-05-15T00:00:00.000Z",
      now,
    });
    const staleScore = calculateTrendingScore({
      quantity: 1,
      lineRevenueIdr: 100_000,
      paidAt: "2026-05-01T00:00:00.000Z",
      now,
    });

    expect(recentScore).toBeGreaterThan(staleScore);
    expect(staleScore).toBeCloseTo(recentScore / 2, 5);
  });

  it("ranks paid in-stock products and excludes invalid order states", () => {
    const paidRecent = product({ id: 1, name: "Recent" });
    const paidOlder = product({ id: 2, name: "Older" });
    const unpaid = product({ id: 3, name: "Unpaid" });
    const refunded = product({ id: 4, name: "Refunded" });
    const outOfStock = product({ id: 5, name: "Out of stock", stock: 0 });

    const ranked = rankTrendingProducts({
      sales: [
        sale({ product: paidOlder, paidAt: "2026-05-01T00:00:00.000Z" }),
        sale({ product: paidRecent, paidAt: "2026-05-14T00:00:00.000Z" }),
        sale({ product: unpaid, paymentStatus: "pending" }),
        sale({ product: refunded, orderStatus: "REFUNDED" }),
        sale({ product: outOfStock }),
      ],
      fallbackProducts: [paidRecent, paidOlder, unpaid, refunded, outOfStock],
      limit: 5,
      now,
    });

    expect(ranked.map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it("fills with newest in-stock fallback products when sales are sparse", () => {
    const sold = product({ id: 1, name: "Sold", updated_at: "2026-05-01T00:00:00.000Z" });
    const newest = product({ id: 2, name: "Newest", updated_at: "2026-05-14T00:00:00.000Z" });
    const older = product({ id: 3, name: "Older", updated_at: "2026-05-02T00:00:00.000Z" });

    const ranked = rankTrendingProducts({
      sales: [sale({ product: sold })],
      fallbackProducts: [older, newest, sold],
      limit: 3,
      now,
    });

    expect(ranked.map((item) => item.id)).toEqual([1, 2, 3]);
  });
});
