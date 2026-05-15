import { NextResponse } from "next/server";
import { getTrendingProducts } from "@/application/catalog/trending-products";
import { SupabaseCatalogRepository } from "@/infrastructure/supabase/catalog-repository";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await getTrendingProducts(
      { limit: Number(searchParams.get("limit") ?? 4) },
      new SupabaseCatalogRepository(),
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load trending products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
