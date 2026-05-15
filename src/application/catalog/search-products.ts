import type { Category, Product } from "@/types/database";
import type {
  CatalogTrendingRepository,
  NormalizedTrendingProductsInput,
  TrendingProductsResult,
} from "@/application/catalog/trending-products";

export type ProductSort = "relevance" | "price-asc" | "price-desc";

export interface ProductSearchInput {
  search?: string;
  categorySlug?: string;
  sort?: ProductSort;
  page: number;
  pageSize: number;
}

export interface ProductSearchResult {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogRepository {
  getTrendingProducts(input: NormalizedTrendingProductsInput): Promise<TrendingProductsResult>;
  searchProducts(input: ProductSearchInput): Promise<ProductSearchResult>;
}

export type { CatalogTrendingRepository };

export function normalizeProductSearchInput(input: Partial<ProductSearchInput>): ProductSearchInput {
  return {
    search: input.search?.trim() || "",
    categorySlug: input.categorySlug?.trim() || "",
    sort: input.sort ?? "relevance",
    page: Math.max(1, Number(input.page ?? 1) || 1),
    pageSize: Math.min(50, Math.max(1, Number(input.pageSize ?? 9) || 9)),
  };
}
