import { NextResponse } from "next/server";
import { cartResolveRequestSchema } from "@/application/catalog/cart-schemas";
import { formatRp } from "@/domain/checkout";
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

  const productById = new Map((data ?? []).map((product) => [Number(product.id), product as any]));
  const issues: string[] = [];
  const items = parsed.data.items.flatMap((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      issues.push(`Product ${item.productId} is no longer available.`);
      return [];
    }

    const pricingType = product.pricing_type ?? "fixed";
    if (pricingType === "variant") {
      issues.push(`${product.name} variants are no longer supported.`);
      return [];
    }

    if (pricingType === "custom_amount") {
      const amount = Number(item.customAmountRaw ?? 0);
      const min = Number(product.min_price_raw ?? 0);
      const max = Number(product.max_price_raw ?? 0);
      if (!Number.isInteger(amount) || amount < min || amount > max) {
        issues.push(`${product.name} budget must be between ${formatRp(min)} and ${formatRp(max)}.`);
        return [];
      }
    } else if (item.customAmountRaw) {
      issues.push(`${product.name} does not support custom amount.`);
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

    return [{
      product,
      customAmountRaw: item.customAmountRaw ?? null,
      buyerNote: item.buyerNote ?? "",
      quantity,
    }];
  });

  return NextResponse.json({ items, issues });
}
