import type { EmailProvider } from "@/application/notifications/send-email-event";

interface BrevoSendEmailResponse {
  messageId?: string;
  messageIds?: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export class BrevoEmailProvider implements EmailProvider {
  async send(input: {
    to: { email: string; name?: string | null };
    subject: string;
    htmlContent: string;
    textContent: string;
    tags: string[];
    idempotencyKey: string;
  }): Promise<{ messageId: string }> {
    const apiKey = requireEnv("BREVO_API_KEY");
    const fromEmail = requireEnv("EMAIL_FROM_ADDRESS");
    const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Tokonesia";
    const replyTo = process.env.EMAIL_REPLY_TO_ADDRESS?.trim();

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: input.to.email, name: input.to.name || undefined }],
        replyTo: replyTo ? { email: replyTo, name: fromName } : undefined,
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent,
        tags: input.tags,
        headers: { "Idempotency-Key": input.idempotencyKey },
      }),
    });

    const data = await response.json().catch(() => ({})) as BrevoSendEmailResponse & { message?: string };
    if (!response.ok) {
      throw new Error(data.message || `Brevo email failed with status ${response.status}`);
    }

    return { messageId: data.messageId || data.messageIds?.[0] || input.idempotencyKey };
  }
}
