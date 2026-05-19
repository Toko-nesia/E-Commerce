import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  PaymentSyncOrderNotFoundError,
  PaymentSyncUnavailableError,
  syncMidtransPaymentStatus,
} from "@/application/payments/sync-midtrans-payment-status";
import { MidtransTransactionStatusProvider } from "@/infrastructure/midtrans/transaction-status-provider";
import { SupabasePaymentSyncRepository } from "@/infrastructure/supabase/payment-sync-repository";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";
import { createServiceClient } from "@/lib/supabase/service";
import { paymentHistoryCopy, recordOrderHistoryEvent } from "@/application/orders/order-history";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncMidtransPaymentStatus(
      { orderId: id, userId: user.id },
      {
        repository: new SupabasePaymentSyncRepository(),
        midtrans: new MidtransTransactionStatusProvider(),
      },
    );

    if (result.sync.status === "processed" && result.sync.orderId) {
      const copy = paymentHistoryCopy(result.sync.paymentStatus);
      await recordOrderHistoryEvent(createServiceClient(), {
        orderId: result.sync.orderId,
        eventType: `payment_${result.sync.paymentStatus ?? "updated"}`,
        actorType: "payment_provider",
        toStatus: result.sync.orderStatus,
        toPaymentStatus: result.sync.paymentStatus,
        title: copy.title,
        description: copy.description,
        metadata: { transactionStatus: result.sync.transactionStatus },
        dedupeKey: `payment:${result.order.midtransOrderId}:${result.sync.paymentStatus}`,
      });
      if (result.sync.paymentStatus === "settlement" || result.sync.paymentStatus === "capture") {
        await notifyOrderEvent({ eventType: "payment_succeeded", orderId: result.sync.orderId });
        await notifyOrderEvent({ eventType: "admin_new_paid_order", orderId: result.sync.orderId });
      } else if (result.sync.paymentStatus === "expire") {
        await notifyOrderEvent({ eventType: "payment_expired", orderId: result.sync.orderId });
      } else if (["cancel", "deny", "failure"].includes(result.sync.paymentStatus ?? "")) {
        await notifyOrderEvent({ eventType: "payment_failed", orderId: result.sync.orderId });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentSyncOrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof PaymentSyncUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Failed to sync payment status.";
    console.error("[orders/sync-payment] failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
