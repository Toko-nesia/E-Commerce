import type { EmailAudience, EmailEventType } from "@/domain/notifications";

export interface EmailEventDraft {
  dedupeKey: string;
  eventType: EmailEventType;
  audience: EmailAudience;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  htmlContent: string;
  textContent: string;
  tags: string[];
  payload: Record<string, unknown>;
  orderId?: string | null;
  refundRequestId?: string | null;
  userId?: string | null;
}

export interface EmailEventRecord extends EmailEventDraft {
  id: string;
  status: "queued" | "sending" | "sent" | "failed" | "skipped";
  attemptCount: number;
}

export interface EmailEventRepository {
  enqueue(input: EmailEventDraft): Promise<{ event: EmailEventRecord; inserted: boolean }>;
  markSending(id: string): Promise<void>;
  markSent(id: string, providerMessageId: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  markSkipped(id: string): Promise<void>;
}

export interface EmailProvider {
  send(input: {
    to: { email: string; name?: string | null };
    subject: string;
    htmlContent: string;
    textContent: string;
    tags: string[];
    idempotencyKey: string;
  }): Promise<{ messageId: string }>;
}

export async function enqueueAndDispatchEmailEvent(
  draft: EmailEventDraft,
  deps: {
    repository: EmailEventRepository;
    provider: EmailProvider;
  },
): Promise<{ status: "sent" | "failed" | "skipped"; eventId: string }> {
  const { event, inserted } = await deps.repository.enqueue(draft);
  if (!inserted && (event.status === "sent" || event.status === "sending")) {
    return { status: "skipped", eventId: event.id };
  }

  await deps.repository.markSending(event.id);
  try {
    const result = await deps.provider.send({
      to: { email: draft.recipientEmail, name: draft.recipientName },
      subject: draft.subject,
      htmlContent: draft.htmlContent,
      textContent: draft.textContent,
      tags: draft.tags,
      idempotencyKey: draft.dedupeKey,
    });
    await deps.repository.markSent(event.id, result.messageId);
    return { status: "sent", eventId: event.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed";
    await deps.repository.markFailed(event.id, message);
    return { status: "failed", eventId: event.id };
  }
}
