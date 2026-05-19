import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";
import { paymentHistoryCopy, recordOrderHistoryEvent } from "@/application/orders/order-history";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await (service as any).rpc("expire_pending_payment_order", {
    p_order_id: id,
    p_user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data ?? {}) as { status?: string; order_id?: string };
  if (result.status === "forbidden" || result.status === "order_not_found") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (result.status === "expired") {
    const copy = paymentHistoryCopy("expire");
    await recordOrderHistoryEvent(service, {
      orderId: id,
      eventType: "payment_expired",
      actorType: "system",
      toStatus: "PAYMENT_EXPIRED",
      toPaymentStatus: "expire",
      title: copy.title,
      description: copy.description,
      dedupeKey: `payment:${id}:expire`,
    });
    await notifyOrderEvent({ eventType: "payment_expired", orderId: id });
  }

  return NextResponse.json({ result });
}
