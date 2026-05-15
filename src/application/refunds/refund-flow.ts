type ServiceClient = any;

const BUYER_REQUESTABLE_STATUSES = new Set(["BARU", "DIPROSES", "DIKIRIM"]);

async function getUserRole(supabase: ServiceClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.role ?? "user";
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

  const { data: existing, error: existingError } = await input.supabase
    .from("refund_requests")
    .select("id")
    .eq("order_id", input.orderId)
    .in("status", ["awaiting_seller_review", "awaiting_buyer_payout", "awaiting_manual_transfer"])
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

  return refund;
}

export async function createSellerCancellation(input: {
  supabase: ServiceClient;
  adminUserId: string;
  orderId: string;
  reason: string;
}) {
  await assertAdmin(input.supabase, input.adminUserId);
  const { data: order, error: orderError } = await input.supabase
    .from("orders")
    .select("id, user_id, status, total_price_raw")
    .eq("id", input.orderId)
    .maybeSingle();
  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order not found.");
  if (["DIBATALKAN", "REFUNDED", "SELESAI"].includes(order.status)) {
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

  return refund;
}

export async function reviewRefundRequest(input: {
  supabase: ServiceClient;
  adminUserId: string;
  refundId: string;
  action: "approve" | "reject";
  note?: string;
  rejectionReason?: string;
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

  return { status: "awaiting_manual_transfer" };
}

export async function markRefunded(input: {
  supabase: ServiceClient;
  adminUserId: string;
  refundId: string;
  transferNote?: string;
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

  return { status: "refunded" };
}
