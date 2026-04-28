import { NextRequest, NextResponse } from "next/server";
import { getShippingRate } from "@/lib/fedex/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postalCode, countryCode, totalWeightKg } = body as {
      postalCode: string;
      countryCode: string;
      totalWeightKg: number;
    };

    if (!postalCode || !countryCode || typeof totalWeightKg !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: postalCode, countryCode, totalWeightKg" },
        { status: 400 }
      );
    }

    const result = await getShippingRate(postalCode, countryCode, totalWeightKg);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Shipping rate unavailable" },
      { status: 503 }
    );
  }
}
