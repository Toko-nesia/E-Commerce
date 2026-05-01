import { NextResponse } from "next/server";
import { FedExService } from "@/lib/fedex/service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get("tracking_number");

    if (!trackingNumber) {
      return NextResponse.json({ error: "Missing tracking_number" }, { status: 400 });
    }

    // Call the server-side FedEx service
    const response = await FedExService.trackShipment(trackingNumber);

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
