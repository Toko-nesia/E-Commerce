import { NextResponse } from "next/server";
import { normalizeProductSearchInput } from "@/application/catalog/search-products";
import { SupabaseCatalogRepository } from "@/infrastructure/supabase/catalog-repository";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const input = normalizeProductSearchInput({
      search: searchParams.get("search") ?? "",
      categorySlug: searchParams.get("category") ?? "",
      sort: (searchParams.get("sort") as any) || "relevance",
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 9),
    });

    const result = await new SupabaseCatalogRepository().searchProducts(input);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
