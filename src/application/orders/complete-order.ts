import { recordOrderHistoryEvent } from "@/application/orders/order-history";

type ServiceClient = any;

const PAID_STATUSES = new Set(["settlement", "capture"]);

export async function completeOrderByBuyer(input: {
  supabase: ServiceClient;
  orderId: string;
  userId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const { data: order, error } = await input.supabase
    .from("orders")
    .select("id, user_id, status, payment_status, completion_deadline_at")
    .eq("id", input.orderId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found.");
  if (order.status === "SELESAI") return { status: "already_completed" };
  if (order.status !== "DIKIRIM") throw new Error("Only shipped orders can be completed.");
  if (!PAID_STATUSES.has(order.payment_status ?? "")) throw new Error("Payment must be confirmed before completing this order.");

  const { error: updateError } = await input.supabase
    .from("orders")
    .update({ status: "SELESAI", updated_at: now.toISOString() })
    .eq("id", input.orderId)
    .eq("user_id", input.userId)
    .eq("status", "DIKIRIM");
  if (updateError) throw new Error(updateError.message);

  await recordOrderHistoryEvent(input.supabase, {
    orderId: input.orderId,
    eventType: "order_completed",
    actorType: "buyer",
    actorUserId: input.userId,
    fromStatus: "DIKIRIM",
    toStatus: "SELESAI",
    title: "Order Completed",
    description: "The buyer confirmed that this order was received and completed.",
    dedupeKey: `order:${input.orderId}:completed:buyer`,
  });

  return { status: "completed" };
}

export async function completeOverdueShippedOrders(input: {
  supabase: ServiceClient;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const { data: orders, error } = await input.supabase
    .from("orders")
    .select("id, status, payment_status, completion_deadline_at")
    .eq("status", "DIKIRIM")
    .in("payment_status", ["settlement", "capture"])
    .not("completion_deadline_at", "is", null)
    .lte("completion_deadline_at", now.toISOString())
    .limit(100);
  if (error) throw new Error(error.message);

  const completed: string[] = [];
  for (const order of orders ?? []) {
    const { error: updateError } = await input.supabase
      .from("orders")
      .update({ status: "SELESAI", updated_at: now.toISOString() })
      .eq("id", order.id)
      .eq("status", "DIKIRIM");
    if (updateError) throw new Error(updateError.message);

    await recordOrderHistoryEvent(input.supabase, {
      orderId: order.id,
      eventType: "order_auto_completed",
      actorType: "system",
      fromStatus: "DIKIRIM",
      toStatus: "SELESAI",
      title: "Order Auto-Completed",
      description: "The completion deadline passed, so the system marked this shipped order as completed.",
      dedupeKey: `order:${order.id}:completed:system`,
    });
    completed.push(order.id);
  }

  return { status: "ok", completed };
}

export async function completeOverdueOrderForUser(input: {
  supabase: ServiceClient;
  orderId: string;
  userId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const { data: order, error } = await input.supabase
    .from("orders")
    .select("id, user_id, status, payment_status, completion_deadline_at")
    .eq("id", input.orderId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found.");
  if (order.status !== "DIKIRIM") return { status: "not_due" };
  if (!PAID_STATUSES.has(order.payment_status ?? "")) return { status: "not_due" };
  if (!order.completion_deadline_at || new Date(order.completion_deadline_at).getTime() > now.getTime()) {
    return { status: "not_due" };
  }

  const { error: updateError } = await input.supabase
    .from("orders")
    .update({ status: "SELESAI", updated_at: now.toISOString() })
    .eq("id", input.orderId)
    .eq("status", "DIKIRIM");
  if (updateError) throw new Error(updateError.message);

  await recordOrderHistoryEvent(input.supabase, {
    orderId: input.orderId,
    eventType: "order_auto_completed",
    actorType: "system",
    fromStatus: "DIKIRIM",
    toStatus: "SELESAI",
    title: "Order Auto-Completed",
    description: "The completion deadline passed, so the system marked this shipped order as completed.",
    dedupeKey: `order:${input.orderId}:completed:system`,
  });

  return { status: "completed", completed: [input.orderId] };
}
