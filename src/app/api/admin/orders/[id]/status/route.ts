import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOrderStatus, type OrderStatus } from "@/domain/order-status";
import { assertAdmin, createSellerCancellation } from "@/application/refunds/refund-flow";
import { isValidTransition, requiresCancelReason, requiresTrackingNumber } from "@/lib/order-status-utils";
import { validateTrackingNumber } from "@/lib/fedex/service";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";
import type { TablesUpdate } from "@/types/supabase";

const updateOrderStatusSchema = z.object({
  status: z.string(),
  trackingNumber: z.string().trim().optional(),
  cancelReason: z.string().trim().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = updateOrderStatusSchema.parse(await req.json());
    if (!isOrderStatus(body.status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const nextStatus = body.status as OrderStatus;
    const serviceClient = createServiceClient();
    await assertAdmin(serviceClient, user.id);

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (!isOrderStatus(order.status) || !isValidTransition(order.status, nextStatus)) {
      return NextResponse.json({ error: "Invalid order status transition" }, { status: 400 });
    }

    if (requiresTrackingNumber(nextStatus)) {
      if (!body.trackingNumber) {
        return NextResponse.json({ error: "Tracking number is required." }, { status: 400 });
      }
      if (!validateTrackingNumber(body.trackingNumber)) {
        return NextResponse.json({ error: "Invalid tracking number." }, { status: 400 });
      }
    }

    if (requiresCancelReason(nextStatus) && !body.cancelReason) {
      return NextResponse.json({ error: "Cancellation reason is required." }, { status: 400 });
    }

    if (nextStatus === "CANCEL_APPROVED") {
      const refund = await createSellerCancellation({
        supabase: serviceClient,
        adminUserId: user.id,
        orderId: id,
        reason: body.cancelReason ?? "",
        notify: notifyOrderEvent,
      });
      return NextResponse.json({ success: true, refund });
    }

    const updates: TablesUpdate<"orders"> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    if (requiresTrackingNumber(nextStatus)) updates.tracking_number = body.trackingNumber ?? "";
    if (requiresCancelReason(nextStatus)) updates.cancel_reason = body.cancelReason ?? "";

    const { error: updateError } = await serviceClient
      .from("orders")
      .update(updates)
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);

    if (nextStatus === "DIKIRIM") {
      await notifyOrderEvent({ eventType: "order_shipped", orderId: id });
    } else if (nextStatus === "SELESAI") {
      await notifyOrderEvent({ eventType: "order_completed", orderId: id });
    } else if (nextStatus === "DIBATALKAN") {
      await notifyOrderEvent({ eventType: "order_cancelled", orderId: id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
