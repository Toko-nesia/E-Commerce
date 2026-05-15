import type { Product } from "@/types/database";

const DEFAULT_TRENDING_LIMIT = 4;
const MAX_TRENDING_LIMIT = 20;
const TRENDING_WINDOW_DAYS = 30;
const HALF_LIFE_DAYS = 14;
const REVENUE_WEIGHT = 0.15;
const REVENUE_UNIT_IDR = 100_000;
const DAY_MS = 24 * 60 * 60 * 1000;

const PAID_PAYMENT_STATUSES = new Set(["settlement", "capture"]);
const EXCLUDED_ORDER_STATUSES = new Set([
  "DIBATALKAN",
  "REFUNDED",
  "CANCEL_REQUESTED",
  "CANCEL_APPROVED",
  "REFUND_INFO_SUBMITTED",
]);

export interface TrendingProductsInput {
  limit?: number;
  now?: Date;
}

export interface NormalizedTrendingProductsInput {
  limit: number;
  now: Date;
}

export interface TrendingProductsResult {
  products: Product[];
}

export interface TrendingSaleSignal {
  product: Product;
  quantity: number;
  priceRaw: number;
  paidAt: string | Date | null;
  paymentStatus: string | null;
  orderStatus: string | null;
}

export interface CatalogTrendingRepository {
  getTrendingProducts(input: NormalizedTrendingProductsInput): Promise<TrendingProductsResult>;
}

export function normalizeTrendingProductsInput(
  input: TrendingProductsInput = {},
): NormalizedTrendingProductsInput {
  const numericLimit = Number(input.limit ?? DEFAULT_TRENDING_LIMIT);
  const limit = Math.min(
    MAX_TRENDING_LIMIT,
    Math.max(1, Number.isFinite(numericLimit) ? Math.trunc(numericLimit) : DEFAULT_TRENDING_LIMIT),
  );

  return {
    limit,
    now: input.now ?? new Date(),
  };
}

export function calculateTrendingScore(input: {
  quantity: number;
  lineRevenueIdr: number;
  paidAt: string | Date;
  now: Date;
}): number {
  const paidAt = input.paidAt instanceof Date ? input.paidAt : new Date(input.paidAt);
  if (Number.isNaN(paidAt.getTime())) return 0;

  const ageDays = Math.max(0, (input.now.getTime() - paidAt.getTime()) / DAY_MS);
  if (ageDays > TRENDING_WINDOW_DAYS) return 0;

  const decay = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  return input.quantity * decay + (input.lineRevenueIdr / REVENUE_UNIT_IDR) * decay * REVENUE_WEIGHT;
}

export function rankTrendingProducts(input: {
  sales: TrendingSaleSignal[];
  fallbackProducts: Product[];
  limit?: number;
  now?: Date;
}): Product[] {
  const { limit, now } = normalizeTrendingProductsInput({
    limit: input.limit,
    now: input.now,
  });

  const scored = new Map<
    number,
    {
      product: Product;
      score: number;
      latestPaidAt: number;
    }
  >();

  for (const sale of input.sales) {
    const stock = Number(sale.product.stock ?? 0);
    if (stock <= 0 || !sale.paidAt) continue;
    if (!PAID_PAYMENT_STATUSES.has(sale.paymentStatus ?? "")) continue;
    if (EXCLUDED_ORDER_STATUSES.has(sale.orderStatus ?? "")) continue;

    const paidAt = sale.paidAt instanceof Date ? sale.paidAt : new Date(sale.paidAt);
    if (Number.isNaN(paidAt.getTime())) continue;

    const score = calculateTrendingScore({
      quantity: sale.quantity,
      lineRevenueIdr: sale.quantity * sale.priceRaw,
      paidAt,
      now,
    });
    if (score <= 0) continue;

    const existing = scored.get(sale.product.id);
    if (!existing) {
      scored.set(sale.product.id, {
        product: sale.product,
        score,
        latestPaidAt: paidAt.getTime(),
      });
      continue;
    }

    existing.score += score;
    existing.latestPaidAt = Math.max(existing.latestPaidAt, paidAt.getTime());
  }

  const ranked = [...scored.values()].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.latestPaidAt !== left.latestPaidAt) return right.latestPaidAt - left.latestPaidAt;
    return left.product.id - right.product.id;
  });

  const usedProductIds = new Set(ranked.map((entry) => entry.product.id));
  const fallback = input.fallbackProducts
    .filter((product) => Number(product.stock ?? 0) > 0 && !usedProductIds.has(product.id))
    .sort((left, right) => {
      const leftUpdated = new Date(left.updated_at ?? left.created_at ?? 0).getTime();
      const rightUpdated = new Date(right.updated_at ?? right.created_at ?? 0).getTime();
      if (rightUpdated !== leftUpdated) return rightUpdated - leftUpdated;
      return left.id - right.id;
    });

  return [...ranked.map((entry) => entry.product), ...fallback].slice(0, limit);
}

export async function getTrendingProducts(
  input: TrendingProductsInput,
  repository: CatalogTrendingRepository,
): Promise<TrendingProductsResult> {
  return repository.getTrendingProducts(normalizeTrendingProductsInput(input));
}
