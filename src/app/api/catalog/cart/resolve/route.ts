import { NextResponse } from "next/server";
import { cartResolveRequestSchema } from "@/application/catalog/cart-schemas";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const parsed = cartResolveRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  if (productIds.length === 0) {
    return NextResponse.json({ items: [], issues: [] });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const productById = new Map((data ?? []).map((product) => [Number(product.id), product]));
  const issues: string[] = [];
  const items = parsed.data.items.flatMap((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      issues.push(`Product ${item.productId} is no longer available.`);
      return [];
    }

    const stock = Number(product.stock ?? 0);
    if (stock <= 0) {
      issues.push(`${product.name} is out of stock.`);
      return [];
    }

    const quantity = Math.min(item.quantity, stock);
    if (quantity < item.quantity) {
      issues.push(`${product.name} quantity was reduced to available stock (${stock}).`);
    }

    return [{ product, quantity }];
  });

  return NextResponse.json({ items, issues });
}

