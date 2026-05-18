import {
  buildWelcomeEmailDedupeKey,
  renderWelcomeEmail,
} from "@/domain/notifications";
import {
  enqueueAndDispatchEmailEvent,
  type EmailEventRepository,
  type EmailProvider,
} from "./send-email-event";

export async function sendWelcomeEmailNotification(
  input: {
    userId: string;
    email: string;
    name?: string | null;
  },
  deps: {
    eventRepository: EmailEventRepository;
    provider: EmailProvider;
  },
): Promise<{ status: "sent" | "failed" | "skipped"; eventId: string } | null> {
  const email = input.email.trim().toLowerCase();
  if (!input.userId || !email) return null;

  const rendered = renderWelcomeEmail({
    customerName: input.name || email,
  });

  return enqueueAndDispatchEmailEvent({
    dedupeKey: buildWelcomeEmailDedupeKey({ userId: input.userId }),
    eventType: "customer_welcome",
    audience: "customer",
    recipientEmail: email,
    recipientName: input.name || null,
    subject: rendered.subject,
    htmlContent: rendered.htmlContent,
    textContent: rendered.textContent,
    tags: rendered.tags,
    payload: {
      eventType: "customer_welcome",
      userId: input.userId,
    },
    userId: input.userId,
  }, {
    repository: deps.eventRepository,
    provider: deps.provider,
  });
}
