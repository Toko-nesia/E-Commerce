import { NextResponse } from "next/server";
import MidtransClient from "midtrans-client";
import { applyMidtransNotification } from "@/application/payments/apply-midtrans-notification";
import { SupabasePaymentEventRepository } from "@/infrastructure/supabase/payment-event-repository";

const coreApi = new MidtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
});

export async function POST(req: Request) {
  try {
    const notification = await req.json();
    const verified = await (coreApi as any).transaction.notification(notification);
    const result = await applyMidtransNotification(verified, new SupabasePaymentEventRepository());

    console.log("[midtrans/notification] applied:", result);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[midtrans/notification] failed:", error);
    return NextResponse.json({ status: "ok" });
  }
}
