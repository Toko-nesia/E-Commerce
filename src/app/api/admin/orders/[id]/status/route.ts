import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOrderStatus, type OrderStatus } from "@/domain/order-status";
import { assertAdmin, createSellerCancellation } from "@/application/refunds/refund-flow";
import { isValidAdminTransition, requiresCancelReason, requiresTrackingNumber } from "@/lib/order-status-utils";
import { validateTrackingNumber } from "@/lib/fedex/service";
import { notifyOrderEvent } from "@/infrastructure/notifications/notify-order-event";
import { recordOrderHistoryEvent } from "@/application/orders/order-history";
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
      .select("id, status, payment_status, estimated_delivery_at, shipping_method")
      .eq("id", id)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (!isOrderStatus(order.status) || !isValidAdminTransition(order.status, nextStatus)) {
      return NextResponse.json({ error: "Invalid order status transition" }, { status: 400 });
    }
    if (!["settlement", "capture", "refund"].includes(order.payment_status ?? "")) {
      return NextResponse.json({ error: "Payment must be confirmed before this order can be processed." }, { status: 409 });
    }

    const needsTrackingNumber = requiresTrackingNumber(nextStatus, order.shipping_method);

    if (needsTrackingNumber) {
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
    if (nextStatus === "DIKIRIM") {
      const shippedAt = new Date();
      const estimatedDeliveryAt = order.estimated_delivery_at ? new Date(order.estimated_delivery_at) : shippedAt;
      const deadlineBase = Number.isNaN(estimatedDeliveryAt.getTime()) ? shippedAt : estimatedDeliveryAt;
      updates.tracking_number = needsTrackingNumber ? body.trackingNumber ?? "" : "";
      (updates as any).shipped_at = shippedAt.toISOString();
      (updates as any).completion_deadline_at = new Date(deadlineBase.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (requiresCancelReason(nextStatus)) updates.cancel_reason = body.cancelReason ?? "";

    const { error: updateError } = await serviceClient
      .from("orders")
      .update(updates)
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);

    if (nextStatus === "DIKIRIM") {
      await recordOrderHistoryEvent(serviceClient, {
        orderId: id,
        eventType: "order_shipped",
        actorType: "admin",
        actorUserId: user.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        title: order.shipping_method === "internal_courier" ? "Handed to Internal Courier" : "Shipment Created",
        description: order.shipping_method === "internal_courier"
          ? "The seller handed this order to Tokonesia internal courier."
          : "The seller added shipment tracking and marked this order as shipped.",
        metadata: { shippingMethod: order.shipping_method, trackingNumber: needsTrackingNumber ? body.trackingNumber ?? "" : null },
        dedupeKey: `order:${id}:shipped:${order.shipping_method}:${needsTrackingNumber ? body.trackingNumber ?? "" : "internal"}`,
      });
      await notifyOrderEvent({ eventType: "order_shipped", orderId: id });
    } else if (nextStatus === "DIBATALKAN") {
      const { error: releaseError } = await (serviceClient as any).rpc("release_order_stock_once", {
        p_order_id: id,
        p_reason: "admin_order_cancelled",
      });
      if (releaseError) throw new Error(releaseError.message);
      await recordOrderHistoryEvent(serviceClient, {
        orderId: id,
        eventType: "order_cancelled",
        actorType: "admin",
        actorUserId: user.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        title: "Order Cancelled",
        description: "The seller cancelled this order and reserved stock was returned.",
        reason: body.cancelReason ?? "",
        dedupeKey: `order:${id}:admin-cancelled:${nextStatus}`,
      });
      await notifyOrderEvent({ eventType: "order_cancelled", orderId: id });
    } else if (nextStatus === "DIPROSES") {
      await recordOrderHistoryEvent(serviceClient, {
        orderId: id,
        eventType: "order_processing",
        actorType: "admin",
        actorUserId: user.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        title: "Order Processing",
        description: "The seller started preparing this order.",
        dedupeKey: `order:${id}:processing`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
