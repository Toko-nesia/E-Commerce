import { describe, expect, it, vi } from "vitest";
import { applyMidtransNotification, type PaymentEventRepository } from "@/application/payments/apply-midtrans-notification";

describe("applyMidtransNotification", () => {
  it("turns a paid notification into one deterministic payment event", async () => {
    const repository: PaymentEventRepository = {
      applyMidtransPaymentEvent: vi.fn(async () => ({ inserted: true })),
    };

    await applyMidtransNotification(
      {
        order_id: "ZB-ORDER-1",
        transaction_status: "settlement",
        transaction_id: "trx-1",
        gross_amount: "126000.00",
      },
      repository,
    );

    expect(repository.applyMidtransPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        midtransOrderId: "ZB-ORDER-1",
        eventType: "midtrans.notification",
        transactionStatus: "settlement",
        paymentStatus: "settlement",
        orderStatus: "DIPROSES",
        transactionId: "trx-1",
      }),
    );
  });

  it("ignores unknown statuses without touching order state", async () => {
    const repository: PaymentEventRepository = {
      applyMidtransPaymentEvent: vi.fn(async () => ({ inserted: true })),
    };

    const result = await applyMidtransNotification(
      {
        order_id: "ZB-ORDER-1",
        transaction_status: "authorize",
      },
      repository,
    );

    expect(result).toEqual({ status: "ignored_unknown_status", transactionStatus: "authorize" });
    expect(repository.applyMidtransPaymentEvent).not.toHaveBeenCalled();
  });
});
