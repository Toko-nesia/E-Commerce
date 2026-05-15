import { createServiceClient } from "@/lib/supabase/service";
import type {
  OrderNotificationDataRepository,
  OrderNotificationSnapshot,
  RefundNotificationSnapshot,
} from "@/application/notifications/order-email-notifications";
import type { EmailRecipient } from "@/domain/notifications";

type SupabaseClient = ReturnType<typeof createServiceClient>;

function formatRp(value: number | null | undefined, fallback?: string | null): string {
  if (fallback && fallback.trim().length > 0) return fallback;
  if (typeof value !== "number") return "-";
  return `Rp${value.toLocaleString("id-ID")}`;
}

export class SupabaseNotificationDataRepository implements OrderNotificationDataRepository {
  constructor(private readonly supabase: SupabaseClient = createServiceClient()) {}

  async getOrderSnapshot(orderId: string): Promise<OrderNotificationSnapshot | null> {
    const { data, error } = await this.supabase
      .from("orders")
      .select(`
        id,
        user_id,
        total_price,
        total_price_raw,
        status,
        payment_status,
        tracking_number,
        estimated_delivery,
        cancel_reason,
        profiles(full_name, email)
      `)
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const profile = Array.isArray((data as any).profiles)
      ? (data as any).profiles[0]
      : (data as any).profiles;

    return {
      id: data.id,
      userId: data.user_id,
      customerName: profile?.full_name || profile?.email || "Customer",
      customerEmail: profile?.email || "",
      total: formatRp(data.total_price_raw, data.total_price),
      status: data.status,
      paymentStatus: data.payment_status,
      trackingNumber: data.tracking_number || null,
      estimatedDelivery: data.estimated_delivery || null,
      cancelReason: data.cancel_reason || null,
    };
  }

  async getRefundSnapshot(refundRequestId: string): Promise<RefundNotificationSnapshot | null> {
    const { data, error } = await this.supabase
      .from("refund_requests")
      .select("id, reason, rejection_reason, refund_amount, payout_provider")
      .eq("id", refundRequestId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      reason: data.reason || null,
      rejectionReason: data.rejection_reason || null,
      refundAmount: formatRp(data.refund_amount ?? null),
      payoutProvider: data.payout_provider || null,
    };
  }

  async getAdminRecipients(): Promise<EmailRecipient[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .neq("email", "");
    if (error) throw new Error(error.message);

    return (data ?? [])
      .filter((row) => row.email)
      .map((row) => ({ email: row.email, name: row.full_name }));
  }
}
