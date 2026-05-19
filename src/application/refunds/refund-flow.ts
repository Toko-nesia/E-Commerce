import type { EmailEventType } from "@/domain/notifications";
import { recordOrderHistoryEvent } from "@/application/orders/order-history";

type ServiceClient = any;
type RefundNotificationSender = (input: {
  eventType: EmailEventType;
  orderId: string;
  refundRequestId: string;
}) => Promise<void>;

const BUYER_REQUESTABLE_STATUSES = new Set(["BARU", "DIPROSES", "DIKIRIM"]);
const ACTIVE_CANCELLATION_STATUSES = [
  "awaiting_seller_review",
  "awaiting_buyer_payout",
  "awaiting_manual_transfer",
];

async function getUserRole(supabase: ServiceClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.role ?? "user";
}

async function notifyRefundEvents(
  notify: RefundNotificationSender | undefined,
  events: EmailEventType[],
  orderId: string,
  refundRequestId: string,
) {
  if (!notify) return;
  await Promise.all(events.map((eventType) => notify({ eventType, orderId, refundRequestId })));
}

async function releaseOrderStockOnce(supabase: ServiceClient, orderId: string, reason: string) {
  const { error } = await supabase.rpc("release_order_stock_once", {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
}

export async function assertAdmin(supabase: ServiceClient, userId: string) {
  const role = await getUserRole(supabase, userId);
  if (role !== "admin") {
    throw new Error("Forbidden");
  }
}

export async function createBuyerCancellationRequest(input: {
  supabase: ServiceClient;
  userId: string;
  orderId: string;
  reason: string;
  notify?: RefundNotificationSender;
}) {
  const { data: order, error: orderError } = await input.supabase
    .from("orders")
    .select("id, user_id, status, total_price_raw")
    .eq("id", input.orderId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order not found.");
  if (!BUYER_REQUESTABLE_STATUSES.has(order.status)) {
    throw new Error("This order cannot be cancelled by buyer request.");
  }

  const { data: priorBuyerRequest, error: priorBuyerRequestError } = await input.supabase
    .from("refund_requests")
    .select("id, status")
    .eq("order_id", input.orderId)
    .eq("user_id", input.userId)
    .eq("initiated_by", "buyer")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (priorBuyerRequestError) throw new Error(priorBuyerRequestError.message);
  if (priorBuyerRequest) {
    throw new Error("Cancellation request can only be submitted once for this order.");
  }

  const { data: existing, error: existingError } = await input.supabase
    .from("refund_requests")
    .select("id")
    .eq("order_id", input.orderId)
    .in("status", ACTIVE_CANCELLATION_STATUSES)
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) throw new Error("A cancellation request is already active for this order.");

  const { data: refund, error: refundError } = await input.supabase
    .from("refund_requests")
    .insert({
      order_id: input.orderId,
      user_id: input.userId,
      refund_method: "",
      account_number: "",
      reason: input.reason,
      status: "awaiting_seller_review",
      initiated_by: "buyer",
      initiated_by_user_id: input.userId,
      previous_order_status: order.status,
      refund_amount: order.total_price_raw,
      buyer_reason: input.reason,
    })
    .select("*")
    .single();
  if (refundError) throw new Error(refundError.message);

  const { error: updateError } = await input.supabase
    .from("orders")
    .update({ status: "CANCEL_REQUESTED", cancel_reason: input.reason, updated_at: new Date().toISOString() })
    .eq("id", input.orderId);
  if (updateError) throw new Error(updateError.message);
  await recordOrderHistoryEvent(input.supabase, {
    orderId: input.orderId,
    eventType: "buyer_cancellation_requested",
    actorType: "buyer",
    actorUserId: input.userId,
    fromStatus: order.status,
    toStatus: "CANCEL_REQUESTED",
    title: "Cancellation Requested",
    description: "The buyer requested order cancellation and is waiting for seller review.",
    reason: input.reason,
    dedupeKey: `order:${input.orderId}:buyer-cancellation-requested`,
  });

  await notifyRefundEvents(input.notify, [
    "buyer_cancellation_requested",
    "admin_buyer_cancellation_requested",
  ], input.orderId, refund.id);

  return refund;
}

export async function cancelBuyerCancellationRequest(input: {
  supabase: ServiceClient;
  userId: string;
  orderId: string;
  notify?: RefundNotificationSender;
}) {
  const { data: refund, error: refundError } = await input.supabase
    .from("refund_requests")
    .select("id, order_id, user_id, status, initiated_by, previous_order_status")
    .eq("order_id", input.orderId)
    .eq("user_id", input.userId)
    .eq("initiated_by", "buyer")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (refundError) throw new Error(refundError.message);
  if (!refund) throw new Error("Cancellation request not found.");
  if (refund.status !== "awaiting_seller_review") {
    throw new Error("Cancellation request can no longer be cancelled.");
  }

  const nextOrderStatus = BUYER_REQUESTABLE_STATUSES.has(refund.previous_order_status)
    ? refund.previous_order_status
    : "DIPROSES";
  const now = new Date().toISOString();

  const { data: updatedRefund, error: updateRefundError } = await input.supabase
    .from("refund_requests")
    .update({
      status: "cancelled_by_buyer",
      cancelled_at: now,
      updated_at: now,
    })
    .eq("id", refund.id)
    .eq("status", "awaiting_seller_review")
    .select("*")
    .single();
  if (updateRefundError) throw new Error(updateRefundError.message);

  const { error: orderError } = await input.supabase
    .from("orders")
    .update({
      status: nextOrderStatus,
      cancel_reason: null,
      updated_at: now,
    })
    .eq("id", input.orderId)
    .eq("user_id", input.userId);
  if (orderError) throw new Error(orderError.message);
  await recordOrderHistoryEvent(input.supabase, {
    orderId: input.orderId,
    eventType: "buyer_cancellation_withdrawn",
    actorType: "buyer",
    actorUserId: input.userId,
    fromStatus: "CANCEL_REQUESTED",
    toStatus: nextOrderStatus,
    title: "Cancellation Request Withdrawn",
    description: "The buyer withdrew the cancellation request. This order cannot be requested for cancellation again.",
    dedupeKey: `order:${input.orderId}:buyer-cancellation-withdrawn`,
  });

  await notifyRefundEvents(input.notify, [
    "buyer_cancellation_withdrawn",
    "admin_buyer_cancellation_withdrawn",
  ], input.orderId, updatedRefund.id);

  return { refund: updatedRefund, orderStatus: nextOrderStatus };
}

export async function createSellerCancellation(input: {
  supabase: ServiceClient;
  adminUserId: string;
  orderId: string;
  reason: string;
  notify?: RefundNotificationSender;
}) {
  await assertAdmin(input.supabase, input.adminUserId);
  const { data: order, error: orderError } = await input.supabase
    .from("orders")
    .select("id, user_id, status, total_price_raw")
    .eq("id", input.orderId)
    .maybeSingle();
  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order not found.");
  if (["PAYMENT_EXPIRED", "DIBATALKAN", "REFUNDED", "SELESAI"].includes(order.status)) {
    throw new Error("This order cannot be seller-cancelled.");
  }

  const { data: refund, error: refundError } = await input.supabase
    .from("refund_requests")
    .insert({
      order_id: input.orderId,
      user_id: order.user_id,
      refund_method: "",
      account_number: "",
      reason: input.reason,
      status: "awaiting_buyer_payout",
      initiated_by: "seller",
      initiated_by_user_id: input.adminUserId,
      previous_order_status: order.status,
      refund_amount: order.total_price_raw,
      seller_reason: input.reason,
      reviewed_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (refundError) throw new Error(refundError.message);

  const { error: updateError } = await input.supabase
    .from("orders")
    .update({ status: "CANCEL_APPROVED", cancel_reason: input.reason, updated_at: new Date().toISOString() })
    .eq("id", input.orderId);
  if (updateError) throw new Error(updateError.message);
  await releaseOrderStockOnce(input.supabase, input.orderId, "seller_cancellation_approved");
  await recordOrderHistoryEvent(input.supabase, {
    orderId: input.orderId,
    eventType: "seller_cancellation_started",
    actorType: "admin",
    actorUserId: input.adminUserId,
    fromStatus: order.status,
    toStatus: "CANCEL_APPROVED",
    title: "Order Cancelled by Seller",
    description: "The seller cancelled this order and requested buyer payout details.",
    reason: input.reason,
    dedupeKey: `order:${input.orderId}:seller-cancellation-started`,
  });

  await notifyRefundEvents(input.notify, ["seller_cancellation_approved"], input.orderId, refund.id);

  return refund;
}

export async function reviewRefundRequest(input: {
  supabase: ServiceClient;
  adminUserId: string;
  refundId: string;
  action: "approve" | "reject";
  note?: string;
  rejectionReason?: string;
  notify?: RefundNotificationSender;
}) {
  await assertAdmin(input.supabase, input.adminUserId);
  const { data: refund, error } = await input.supabase
    .from("refund_requests")
    .select("id, order_id, status, previous_order_status")
    .eq("id", input.refundId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "awaiting_seller_review") {
    throw new Error("Refund request is not awaiting seller review.");
  }

  if (input.action === "reject") {
    const { error: refundError } = await input.supabase
      .from("refund_requests")
      .update({
        status: "rejected",
        rejection_reason: input.rejectionReason,
        admin_note: input.rejectionReason,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.refundId);
    if (refundError) throw new Error(refundError.message);

    const { error: orderError } = await input.supabase
      .from("orders")
      .update({ status: refund.previous_order_status || "DIPROSES", updated_at: new Date().toISOString() })
      .eq("id", refund.order_id);
    if (orderError) throw new Error(orderError.message);
    await recordOrderHistoryEvent(input.supabase, {
      orderId: refund.order_id,
      eventType: "buyer_cancellation_rejected",
      actorType: "admin",
      actorUserId: input.adminUserId,
      fromStatus: "CANCEL_REQUESTED",
      toStatus: refund.previous_order_status || "DIPROSES",
      title: "Cancellation Rejected",
      description: "The seller rejected the cancellation request and the order returned to its previous status.",
      reason: input.rejectionReason,
      dedupeKey: `order:${refund.order_id}:buyer-cancellation-rejected:${input.refundId}`,
    });
    await notifyRefundEvents(input.notify, ["buyer_cancellation_rejected"], refund.order_id, input.refundId);
    return { status: "rejected" };
  }

  const { error: refundError } = await input.supabase
    .from("refund_requests")
    .update({
      status: "awaiting_buyer_payout",
      review_note: input.note ?? "",
      admin_note: input.note ?? "",
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.refundId);
  if (refundError) throw new Error(refundError.message);

  const { error: orderError } = await input.supabase
    .from("orders")
    .update({ status: "CANCEL_APPROVED", updated_at: new Date().toISOString() })
    .eq("id", refund.order_id);
  if (orderError) throw new Error(orderError.message);
  await releaseOrderStockOnce(input.supabase, refund.order_id, "buyer_cancellation_approved");
  await recordOrderHistoryEvent(input.supabase, {
    orderId: refund.order_id,
    eventType: "buyer_cancellation_approved",
    actorType: "admin",
    actorUserId: input.adminUserId,
    fromStatus: "CANCEL_REQUESTED",
    toStatus: "CANCEL_APPROVED",
    title: "Cancellation Approved",
    description: "The seller approved the cancellation request and requested buyer payout details.",
    reason: input.note,
    dedupeKey: `order:${refund.order_id}:buyer-cancellation-approved:${input.refundId}`,
  });
  await notifyRefundEvents(input.notify, ["seller_cancellation_approved"], refund.order_id, input.refundId);
  return { status: "approved" };
}

export async function submitRefundPayout(input: {
  supabase: ServiceClient;
  userId: string;
  refundId: string;
  refundMethod: string;
  payoutProvider: string;
  accountName: string;
  accountNumber: string;
  notify?: RefundNotificationSender;
}) {
  const { data: refund, error } = await input.supabase
    .from("refund_requests")
    .select("id, order_id, user_id, status")
    .eq("id", input.refundId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "awaiting_buyer_payout") {
    throw new Error("Refund request is not awaiting payout details.");
  }

  const { error: refundError } = await input.supabase
    .from("refund_requests")
    .update({
      status: "awaiting_manual_transfer",
      refund_method: input.refundMethod,
      payout_provider: input.payoutProvider,
      account_name: input.accountName,
      account_number: input.accountNumber,
      payout_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.refundId);
  if (refundError) throw new Error(refundError.message);

  const { error: orderError } = await input.supabase
    .from("orders")
    .update({ status: "REFUND_INFO_SUBMITTED", updated_at: new Date().toISOString() })
    .eq("id", refund.order_id);
  if (orderError) throw new Error(orderError.message);
  await recordOrderHistoryEvent(input.supabase, {
    orderId: refund.order_id,
    eventType: "refund_payout_submitted",
    actorType: "buyer",
    actorUserId: input.userId,
    fromStatus: "CANCEL_APPROVED",
    toStatus: "REFUND_INFO_SUBMITTED",
    title: "Refund Details Submitted",
    description: "The buyer submitted payout details for manual refund.",
    dedupeKey: `order:${refund.order_id}:refund-payout-submitted:${input.refundId}`,
  });

  await notifyRefundEvents(input.notify, [
    "buyer_payout_submitted",
    "admin_buyer_payout_submitted",
  ], refund.order_id, input.refundId);

  return { status: "awaiting_manual_transfer" };
}

export async function markRefunded(input: {
  supabase: ServiceClient;
  adminUserId: string;
  refundId: string;
  transferNote?: string;
  notify?: RefundNotificationSender;
}) {
  await assertAdmin(input.supabase, input.adminUserId);
  const { data: refund, error } = await input.supabase
    .from("refund_requests")
    .select("id, order_id, status")
    .eq("id", input.refundId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "awaiting_manual_transfer") {
    throw new Error("Refund request is not awaiting manual transfer.");
  }

  const { error: refundError } = await input.supabase
    .from("refund_requests")
    .update({
      status: "refunded",
      transfer_note: input.transferNote ?? "",
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.refundId);
  if (refundError) throw new Error(refundError.message);

  const { error: orderError } = await input.supabase
    .from("orders")
    .update({ status: "REFUNDED", payment_status: "refund", updated_at: new Date().toISOString() })
    .eq("id", refund.order_id);
  if (orderError) throw new Error(orderError.message);
  await releaseOrderStockOnce(input.supabase, refund.order_id, "refund_completed");
  await recordOrderHistoryEvent(input.supabase, {
    orderId: refund.order_id,
    eventType: "refund_completed",
    actorType: "admin",
    actorUserId: input.adminUserId,
    fromStatus: "REFUND_INFO_SUBMITTED",
    toStatus: "REFUNDED",
    toPaymentStatus: "refund",
    title: "Refund Completed",
    description: "The seller marked the manual refund transfer as completed.",
    reason: input.transferNote,
    dedupeKey: `order:${refund.order_id}:refund-completed:${input.refundId}`,
  });

  await notifyRefundEvents(input.notify, ["refund_completed"], refund.order_id, input.refundId);

  return { status: "refunded" };
}
