import { NextResponse } from "next/server";
import { POST as createCheckoutIntent } from "@/app/api/checkout/intents/route";

export async function POST(req: Request) {
  const body = await req.clone().json().catch(() => null);

  if (body?.idempotencyKey && body?.addressId && Array.isArray(body?.items)) {
    return createCheckoutIntent(req);
  }

  return NextResponse.json(
    {
      error:
        "This endpoint no longer creates orders directly. Use /api/checkout/intents with an idempotency key.",
    },
    { status: 410 },
  );
}
