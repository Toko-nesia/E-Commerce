import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimateShippingRate } from "@/application/shipping/estimate-shipping-rate";
import { shippingRateRequestSchema } from "@/application/shipping/schemas";
import { SupabaseCheckoutRepository } from "@/infrastructure/supabase/checkout-repository";
import { FedExShippingRateProvider } from "@/infrastructure/fedex/shipping-rate-provider";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const clientErrorPatterns = [
  "Address not found",
  "Invalid product id",
  "Invalid product quantity",
  "Product ",
  "Invalid price",
  "Invalid weight",
  "Insufficient stock",
  "Minimum order weight",
];

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

export async function POST(request: NextRequest) {
  try {
    const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (isRateLimited(key)) {
      return NextResponse.json({ error: "Too many shipping rate requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = shippingRateRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid shipping rate request" },
        { status: 400 }
      );
    }

    const result = await estimateShippingRate(
      {
        userId: user.id,
        addressId: parsed.data.addressId,
        items: parsed.data.items,
      },
      {
        repository: new SupabaseCheckoutRepository(),
        shipping: new FedExShippingRateProvider(),
      },
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/shipping/rates] Error:", message);
    const status = message.includes("Address not found")
      ? 404
      : clientErrorPatterns.some((pattern) => message.includes(pattern))
        ? 400
        : 503;
    return NextResponse.json(
      {
        error: status === 503 ? "Shipping rate unavailable" : message,
        detail: message,
      },
      { status }
    );
  }
}
