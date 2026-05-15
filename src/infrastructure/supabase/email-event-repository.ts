import { createServiceClient } from "@/lib/supabase/service";
import type { EmailEventDraft, EmailEventRecord, EmailEventRepository } from "@/application/notifications/send-email-event";
import type { Json } from "@/types/supabase";

type SupabaseClient = ReturnType<typeof createServiceClient>;

function mapRow(row: any): EmailEventRecord {
  return {
    id: row.id,
    dedupeKey: row.dedupe_key,
    eventType: row.event_type,
    audience: row.audience,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    subject: row.subject,
    htmlContent: row.html_content,
    textContent: row.text_content,
    tags: Array.isArray(row.payload?.tags) ? row.payload.tags : [],
    payload: row.payload ?? {},
    orderId: row.order_id,
    refundRequestId: row.refund_request_id,
    userId: row.user_id,
    status: row.status,
    attemptCount: row.attempt_count ?? 0,
  };
}

export class SupabaseEmailEventRepository implements EmailEventRepository {
  constructor(private readonly supabase: SupabaseClient = createServiceClient()) {}

  async enqueue(input: EmailEventDraft): Promise<{ event: EmailEventRecord; inserted: boolean }> {
    const payload = {
      ...input.payload,
      tags: input.tags,
    };

    const { data, error } = await (this.supabase as any)
      .from("email_events")
      .insert({
        dedupe_key: input.dedupeKey,
        event_type: input.eventType,
        audience: input.audience,
        recipient_email: input.recipientEmail,
        recipient_name: input.recipientName ?? null,
        subject: input.subject,
        html_content: input.htmlContent,
        text_content: input.textContent,
        payload: payload as Json,
        order_id: input.orderId ?? null,
        refund_request_id: input.refundRequestId ?? null,
        user_id: input.userId ?? null,
      })
      .select("*")
      .single();

    if (!error && data) {
      return { event: mapRow(data), inserted: true };
    }

    if (error?.code !== "23505") {
      throw new Error(error?.message ?? "Failed to enqueue email event");
    }

    const { data: existing, error: existingError } = await (this.supabase as any)
      .from("email_events")
      .select("*")
      .eq("dedupe_key", input.dedupeKey)
      .single();
    if (existingError || !existing) {
      throw new Error(existingError?.message ?? "Failed to load duplicate email event");
    }

    return { event: mapRow(existing), inserted: false };
  }

  async markSending(id: string): Promise<void> {
    const { data, error: fetchError } = await (this.supabase as any)
      .from("email_events")
      .select("attempt_count")
      .eq("id", id)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const { error: attemptError } = await (this.supabase as any)
      .from("email_events")
      .update({
        status: "sending",
        attempt_count: (data?.attempt_count ?? 0) + 1,
        sending_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (attemptError) throw new Error(attemptError.message);
  }

  async markSent(id: string, providerMessageId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("email_events")
      .update({
        status: "sent",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("email_events")
      .update({
        status: "failed",
        last_error: errorMessage,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async markSkipped(id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("email_events")
      .update({
        status: "skipped",
        skipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
