import { describe, expect, it, vi } from "vitest";
import {
  enqueueAndDispatchEmailEvent,
  type EmailEventDraft,
  type EmailEventRecord,
  type EmailEventRepository,
  type EmailProvider,
} from "@/application/notifications/send-email-event";

function draft(): EmailEventDraft {
  return {
    dedupeKey: "dedupe-1",
    eventType: "payment_pending",
    audience: "customer",
    recipientEmail: "buyer@example.com",
    recipientName: "Buyer",
    subject: "Subject",
    htmlContent: "<p>Hello</p>",
    textContent: "Hello",
    tags: ["tokonesia"],
    payload: {},
    orderId: "order-1",
  };
}

function record(input: EmailEventDraft, status: EmailEventRecord["status"] = "queued"): EmailEventRecord {
  return {
    ...input,
    id: "event-1",
    status,
    attemptCount: 0,
  };
}

describe("enqueueAndDispatchEmailEvent", () => {
  it("sends a newly inserted event with the dedupe key as provider idempotency key", async () => {
    const input = draft();
    const repository: EmailEventRepository = {
      enqueue: vi.fn(async () => ({ event: record(input), inserted: true })),
      markSending: vi.fn(async () => undefined),
      markSent: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
      markSkipped: vi.fn(async () => undefined),
    };
    const provider: EmailProvider = {
      send: vi.fn(async () => ({ messageId: "message-1" })),
    };

    const result = await enqueueAndDispatchEmailEvent(input, { repository, provider });

    expect(result.status).toBe("sent");
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: "dedupe-1",
    }));
    expect(repository.markSent).toHaveBeenCalledWith("event-1", "message-1");
  });

  it("skips duplicate events without sending another email", async () => {
    const input = draft();
    const repository: EmailEventRepository = {
      enqueue: vi.fn(async () => ({ event: record(input, "sent"), inserted: false })),
      markSending: vi.fn(async () => undefined),
      markSent: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
      markSkipped: vi.fn(async () => undefined),
    };
    const provider: EmailProvider = {
      send: vi.fn(async () => ({ messageId: "message-1" })),
    };

    const result = await enqueueAndDispatchEmailEvent(input, { repository, provider });

    expect(result.status).toBe("skipped");
    expect(provider.send).not.toHaveBeenCalled();
  });

  it("retries an existing failed event without inserting a duplicate row", async () => {
    const input = draft();
    const repository: EmailEventRepository = {
      enqueue: vi.fn(async () => ({ event: record(input, "failed"), inserted: false })),
      markSending: vi.fn(async () => undefined),
      markSent: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
      markSkipped: vi.fn(async () => undefined),
    };
    const provider: EmailProvider = {
      send: vi.fn(async () => ({ messageId: "message-2" })),
    };

    const result = await enqueueAndDispatchEmailEvent(input, { repository, provider });

    expect(result.status).toBe("sent");
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(repository.markSent).toHaveBeenCalledWith("event-1", "message-2");
  });
});
