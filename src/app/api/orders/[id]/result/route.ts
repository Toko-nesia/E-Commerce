import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";

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
    .select("id, midtrans_order_id, status, total_price, total_price_raw, shipping_cost, service_fee, estimated_delivery, payment_status, snap_token_expires_at, created_at")
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
