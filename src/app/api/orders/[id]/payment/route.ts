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
    .select(`
      id,
      midtrans_order_id,
      status,
      payment_status,
      total_price,
      total_price_raw,
      shipping_cost,
      service_fee,
      snap_token,
      snap_redirect_url,
      snap_token_expires_at,
      estimated_delivery,
      created_at,
      order_items(
        id,
        product_id,
        quantity,
        price,
        price_raw,
        products(name, image)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: order, error } = await selectOrder();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let currentOrder = order;
  const initialExpiresAt = currentOrder.snap_token_expires_at ? new Date(currentOrder.snap_token_expires_at) : null;
  const shouldExpire = currentOrder.payment_status === "pending"
    && !!initialExpiresAt
    && initialExpiresAt.getTime() <= Date.now();

  if (shouldExpire) {
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

    const { data: refreshedOrder, error: refreshError } = await selectOrder();
    if (refreshError) {
      return NextResponse.json({ error: refreshError.message }, { status: 500 });
    }
    if (refreshedOrder) currentOrder = refreshedOrder;
  }

  const expiresAt = currentOrder.snap_token_expires_at ? new Date(currentOrder.snap_token_expires_at) : null;
  const isExpired = currentOrder.payment_status === "pending" && !!expiresAt && expiresAt.getTime() <= Date.now();
  const canContinuePayment = currentOrder.payment_status === "pending"
    && !!currentOrder.snap_token
    && !!expiresAt
    && expiresAt.getTime() > Date.now();

  return NextResponse.json({
    order: {
      ...currentOrder,
      isExpired,
      canContinuePayment,
    },
  });
}
