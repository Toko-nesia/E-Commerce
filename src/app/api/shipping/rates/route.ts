import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getShippingRate } from "@/lib/fedex/service";

const rateRequestSchema = z.object({
  postalCode: z.string().trim().min(2).max(20),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  totalWeightKg: z.number().positive().max(1000),
});

const requestCounts = new Map<string, { count: number; resetAt: number }>();

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

    const parsed = rateRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid shipping rate request" },
        { status: 400 }
      );
    }

    const { postalCode, countryCode, totalWeightKg } = parsed.data;
    const result = await getShippingRate(postalCode, countryCode, totalWeightKg);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/shipping/rates] Error:", message);
    return NextResponse.json(
      { error: "Shipping rate unavailable", detail: message },
      { status: 503 }
    );
  }
}
