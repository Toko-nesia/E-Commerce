import { afterEach, describe, expect, it, vi } from "vitest";
import { BrevoEmailProvider } from "@/infrastructure/brevo/brevo-email-provider";

describe("BrevoEmailProvider", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it("sends transactional email with Brevo idempotency header", async () => {
    process.env = {
      ...originalEnv,
      BREVO_API_KEY: "api-key",
      EMAIL_FROM_ADDRESS: "no-reply@example.com",
      EMAIL_FROM_NAME: "Tokonesia",
      EMAIL_REPLY_TO_ADDRESS: "support@example.com",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "message-1" }),
    } as Response);

    const provider = new BrevoEmailProvider();
    const result = await provider.send({
      to: { email: "buyer@example.com", name: "Buyer" },
      subject: "Subject",
      htmlContent: "<p>Hello</p>",
      textContent: "Hello",
      tags: ["tokonesia"],
      idempotencyKey: "dedupe-1",
    });

    expect(result.messageId).toBe("message-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"Idempotency-Key":"dedupe-1"'),
      }),
    );
  });
});
