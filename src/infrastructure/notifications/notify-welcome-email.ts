import { sendWelcomeEmailNotification } from "@/application/notifications/welcome-email-notifications";
import { BrevoEmailProvider } from "@/infrastructure/brevo/brevo-email-provider";
import { SupabaseEmailEventRepository } from "@/infrastructure/supabase/email-event-repository";

export async function notifyWelcomeEmail(input: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<void> {
  try {
    await sendWelcomeEmailNotification(input, {
      eventRepository: new SupabaseEmailEventRepository(),
      provider: new BrevoEmailProvider(),
    });
  } catch (error) {
    console.error("[welcome email] failed:", {
      userId: input.userId,
      email: input.email,
      error,
    });
  }
}
