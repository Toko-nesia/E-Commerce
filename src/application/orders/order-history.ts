type ServiceClient = any;

export type OrderHistoryActorType = "buyer" | "seller" | "admin" | "system" | "payment_provider";

export interface RecordOrderHistoryEventInput {
  orderId: string;
  eventType: string;
  actorType: OrderHistoryActorType;
  actorUserId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  fromPaymentStatus?: string | null;
  toPaymentStatus?: string | null;
  title: string;
  description: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
}

export async function recordOrderHistoryEvent(
  supabase: ServiceClient,
  input: RecordOrderHistoryEventInput,
) {
  const { error } = await supabase
    .from("order_status_events")
    .insert({
      order_id: input.orderId,
      event_type: input.eventType,
      actor_type: input.actorType,
      actor_user_id: input.actorUserId ?? null,
      from_status: input.fromStatus ?? null,
      to_status: input.toStatus ?? null,
      from_payment_status: input.fromPaymentStatus ?? null,
      to_payment_status: input.toPaymentStatus ?? null,
      title: input.title,
      description: input.description,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
      dedupe_key: input.dedupeKey ?? null,
    });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

export function paymentHistoryCopy(paymentStatus: string | null | undefined) {
  if (paymentStatus === "settlement" || paymentStatus === "capture") {
    return {
      title: "Payment Confirmed",
      description: "Payment was confirmed. The order is now waiting for seller fulfillment.",
    };
  }
  if (paymentStatus === "expire") {
    return {
      title: "Payment Expired",
      description: "The payment window expired, this transaction was cancelled, and reserved stock was returned.",
    };
  }
  if (["cancel", "deny", "failure"].includes(paymentStatus ?? "")) {
    return {
      title: "Payment Failed",
      description: "Payment could not be completed, this transaction was cancelled, and reserved stock was returned.",
    };
  }
  return {
    title: "Payment Pending",
    description: "Order was created and stock was reserved while waiting for payment.",
  };
}
