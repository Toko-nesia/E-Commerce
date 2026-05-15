import type { EmailEventType } from "@/domain/notifications";
import { sendOrderEmailNotification } from "@/application/notifications/order-email-notifications";
import { BrevoEmailProvider } from "@/infrastructure/brevo/brevo-email-provider";
import { SupabaseEmailEventRepository } from "@/infrastructure/supabase/email-event-repository";
import { SupabaseNotificationDataRepository } from "@/infrastructure/supabase/notification-data-repository";

export async function notifyOrderEvent(input: {
  eventType: EmailEventType;
  orderId: string;
  refundRequestId?: string | null;
}): Promise<void> {
  try {
    await sendOrderEmailNotification(input, {
      dataRepository: new SupabaseNotificationDataRepository(),
      eventRepository: new SupabaseEmailEventRepository(),
      provider: new BrevoEmailProvider(),
    });
  } catch (error) {
    console.error("[email notification] failed:", {
      eventType: input.eventType,
      orderId: input.orderId,
      error,
    });
  }
}
