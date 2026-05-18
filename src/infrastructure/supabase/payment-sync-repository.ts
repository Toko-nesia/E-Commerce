import { createServiceClient } from "@/lib/supabase/service";
import { SupabasePaymentEventRepository } from "@/infrastructure/supabase/payment-event-repository";
import type { PaymentSyncOrderSnapshot, PaymentSyncRepository } from "@/application/payments/sync-midtrans-payment-status";

type SupabaseClient = ReturnType<typeof createServiceClient>;

export class SupabasePaymentSyncRepository
  extends SupabasePaymentEventRepository
  implements PaymentSyncRepository {
  constructor(private readonly syncSupabase: SupabaseClient = createServiceClient()) {
    super(syncSupabase);
  }

  async getOrderForUser(orderId: string, userId: string): Promise<PaymentSyncOrderSnapshot | null> {
    const { data, error } = await this.syncSupabase
      .from("orders")
      .select("id, midtrans_order_id, status, payment_status")
      .eq("id", orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;

    return {
      id: data.id,
      midtransOrderId: data.midtrans_order_id,
      status: data.status,
      paymentStatus: data.payment_status,
    };
  }
}
