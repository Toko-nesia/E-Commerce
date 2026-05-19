import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";
import { paymentHistoryCopy, recordOrderHistoryEvent } from "@/application/orders/order-history";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const selectOrder = () => service
    .from("orders")
    .select(`
      id,
      midtrans_order_id,
      status,
      total_price,
      total_price_raw,
      shipping_cost,
      shipping_method,
      service_fee,
      estimated_delivery,
      payment_status,
      payment_method,
      snap_token_expires_at,
      created_at,
      order_items(
        id,
        product_id,
        quantity,
        price,
        price_raw,
        buyer_note,
        products(name, image)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data, error } = await selectOrder();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let order = data;
  const expiresAt = order.snap_token_expires_at ? new Date(order.snap_token_expires_at) : null;
  if (order.payment_status === "pending" && expiresAt && expiresAt.getTime() <= Date.now()) {
    const { data: expireResult, error: expireError } = await (service as any).rpc("expire_pending_payment_order", {
      p_order_id: id,
      p_user_id: user.id,
    });
    if (expireError) {
      return NextResponse.json({ error: expireError.message }, { status: 500 });
    }
    if ((expireResult as { status?: string } | null)?.status === "expired") {
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

    const { data: refreshed, error: refreshError } = await selectOrder();
    if (refreshError) {
      return NextResponse.json({ error: refreshError.message }, { status: 500 });
    }
    if (refreshed) order = refreshed;
  }

  return NextResponse.json({ order });
}
