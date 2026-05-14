import { createServiceClient } from "@/lib/supabase/service";
import type { PaymentEventRepository } from "@/application/payments/apply-midtrans-notification";
import type { Json } from "@/types/supabase";

type SupabaseClient = ReturnType<typeof createServiceClient>;

export class SupabasePaymentEventRepository implements PaymentEventRepository {
  constructor(private readonly supabase: SupabaseClient = createServiceClient()) {}

  async applyMidtransPaymentEvent(input: {
    midtransOrderId: string;
    eventHash: string;
    eventType: string;
    transactionStatus: string;
    fraudStatus: string | null;
    paymentStatus: string;
    orderStatus: string;
    transactionId: string | null;
    payload: Record<string, unknown>;
  }): Promise<unknown> {
    const { data, error } = await this.supabase.rpc("apply_midtrans_payment_event", {
      p_midtrans_order_id: input.midtransOrderId,
      p_event_hash: input.eventHash,
      p_event_type: input.eventType,
      p_transaction_status: input.transactionStatus,
      p_fraud_status: input.fraudStatus,
      p_payment_status: input.paymentStatus,
      p_order_status: input.orderStatus,
      p_transaction_id: input.transactionId,
      p_payload: input.payload as Json,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
