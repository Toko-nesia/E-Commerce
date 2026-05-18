import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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
  const { data: order, error } = await service
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const expiresAt = order.snap_token_expires_at ? new Date(order.snap_token_expires_at) : null;
  const isExpired = order.payment_status === "pending" && !!expiresAt && expiresAt.getTime() <= Date.now();
  const canContinuePayment = order.payment_status === "pending"
    && !!order.snap_token
    && !!expiresAt
    && expiresAt.getTime() > Date.now();

  return NextResponse.json({
    order: {
      ...order,
      isExpired,
      canContinuePayment,
    },
  });
}
