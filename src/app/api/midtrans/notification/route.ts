import { NextRequest, NextResponse } from "next/server";
import MidtransClient from "midtrans-client";
import { createServiceClient } from "@/lib/supabase/service";
import { mapPaymentStatusToOrderStatus, isIdempotent } from "@/lib/order-utils";

const coreApi = new MidtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
});

export async function POST(req: NextRequest) {
  // Always return 200 to prevent Midtrans from retrying
  try {
    const notification = await req.json();

    // Verify notification authenticity with Midtrans
    const statusResponse = await (coreApi as any).transaction.notification(notification);

    const {
      order_id: midtransOrderId,
      transaction_status,
      transaction_id,
      fraud_status,
    } = statusResponse;

    const supabase = createServiceClient();

    // Find the order by midtrans_order_id
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("midtrans_order_id", midtransOrderId)
      .single();

    if (fetchError || !order) {
      console.error(`Notification: order not found for midtrans_order_id=${midtransOrderId}`, fetchError);
      return NextResponse.json({ status: "ok" });
    }

    // Idempotency check — skip if already settled
    if (isIdempotent(order.payment_status)) {
      console.log(`Notification: order ${order.id} already settled, skipping.`);
      return NextResponse.json({ status: "ok" });
    }

    const mapping = mapPaymentStatusToOrderStatus(transaction_status, fraud_status);

    if (!mapping) {
      console.warn(`Notification: unrecognised transaction_status=${transaction_status} for order ${order.id}`);
      return NextResponse.json({ status: "ok" });
    }

    const { orderStatus, paymentStatus } = mapping;

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      payment_status: paymentStatus,
      status: orderStatus,
      updated_at: new Date().toISOString(),
    };

    if (transaction_id) {
      updatePayload.midtrans_transaction_id = transaction_id;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id);

    if (updateError) {
      console.error(`Notification: failed to update order ${order.id}`, updateError, notification);
      return NextResponse.json({ status: "ok" });
    }

    // Decrement stock on settlement / capture(accept)
    if (paymentStatus === "settlement" || paymentStatus === "capture") {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", order.id);

      if (itemsError) {
        console.error(`Notification: failed to fetch order_items for order ${order.id}`, itemsError);
        return NextResponse.json({ status: "ok" });
      }

      for (const item of items ?? []) {
        // Decrement stock using a direct update with arithmetic
        const { error: stockError } = await supabase.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });

        if (stockError) {
          console.error(
            `Notification: failed to decrement stock for product ${item.product_id} on order ${order.id}`,
            stockError
          );
        }
      }
    }

    console.log(`Notification: order ${order.id} updated — status=${orderStatus}, payment=${paymentStatus}`);
    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error("Midtrans notification error:", error);
    // Always return 200 to prevent Midtrans retries
    return NextResponse.json({ status: "ok" });
  }
}
