import { createServiceClient } from "@/lib/supabase/service";
import type {
  CatalogRepository,
  ProductSearchInput,
  ProductSearchResult,
} from "@/application/catalog/search-products";
import type { Category, Product } from "@/types/database";

type SupabaseClient = ReturnType<typeof createServiceClient>;

export class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly supabase: SupabaseClient = createServiceClient()) {}

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult> {
    const [{ data: categoriesData, error: categoriesError }, productsResult] = await Promise.all([
      this.supabase.from("categories").select("name, slug, count").order("name"),
      this.fetchProducts(input),
    ]);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    return {
      ...productsResult,
      categories: (categoriesData ?? []) as Category[],
    };
  }

  private async fetchProducts(input: ProductSearchInput): Promise<Omit<ProductSearchResult, "categories">> {
    const from = (input.page - 1) * input.pageSize;
    const to = from + input.pageSize - 1;

    let categoryName = "";
    if (input.categorySlug) {
      const { data, error } = await this.supabase
        .from("categories")
        .select("name")
        .eq("slug", input.categorySlug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      categoryName = data?.name ?? "";
    }

    let query = this.supabase
      .from("products")
      .select("*", { count: "exact" })
      .range(from, to);

    if (categoryName) {
      query = query.eq("category", categoryName);
    }

    if (input.search) {
      const escaped = input.search.replace(/[%_]/g, "\\$&");
      query = query.or(`name.ilike.%${escaped}%,category.ilike.%${escaped}%`);
    }

    if (input.sort === "price-asc") {
      query = query.order("price_raw", { ascending: true });
    } else if (input.sort === "price-desc") {
      query = query.order("price_raw", { ascending: false });
    } else {
      query = query.order("id", { ascending: true });
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      products: (data ?? []) as Product[],
      total: count ?? 0,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
