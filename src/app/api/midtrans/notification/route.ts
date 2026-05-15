import { NextResponse } from "next/server";
import MidtransClient from "midtrans-client";
import { applyMidtransNotification } from "@/application/payments/apply-midtrans-notification";
import { SupabasePaymentEventRepository } from "@/infrastructure/supabase/payment-event-repository";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";

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
    if (result.status === "processed" && result.orderId) {
      if (result.paymentStatus === "settlement" || result.paymentStatus === "capture") {
        await notifyOrderEvent({ eventType: "payment_succeeded", orderId: result.orderId });
        await notifyOrderEvent({ eventType: "admin_new_paid_order", orderId: result.orderId });
      } else if (result.paymentStatus === "expire") {
        await notifyOrderEvent({ eventType: "payment_expired", orderId: result.orderId });
      } else if (["cancel", "deny", "failure"].includes(result.paymentStatus ?? "")) {
        await notifyOrderEvent({ eventType: "payment_failed", orderId: result.orderId });
      }
    }

    console.info("[midtrans/notification] applied:", result);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[midtrans/notification] failed:", error);
    return NextResponse.json({ status: "ok" });
  }
}
