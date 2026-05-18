import { describe, expect, it, vi } from "vitest";
import { applyMidtransNotification, type PaymentEventRepository } from "@/application/payments/apply-midtrans-notification";

describe("applyMidtransNotification", () => {
  it("turns a paid notification into one deterministic payment event", async () => {
    const repository: PaymentEventRepository = {
      applyMidtransPaymentEvent: vi.fn(async () => ({ status: "processed", order_id: "order-1" })),
    };

    const result = await applyMidtransNotification(
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
        orderStatus: "BARU",
        transactionId: "trx-1",
      }),
    );
    expect(result).toEqual({
      status: "processed",
      orderId: "order-1",
      paymentStatus: "settlement",
      orderStatus: "BARU",
      transactionStatus: "settlement",
    });
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

  it("maps Midtrans expiry to a dedicated payment-expired order state", async () => {
    const repository: PaymentEventRepository = {
      applyMidtransPaymentEvent: vi.fn(async () => ({ status: "processed", order_id: "order-1" })),
    };

    const result = await applyMidtransNotification(
      {
        order_id: "ZB-ORDER-1",
        transaction_status: "expire",
      },
      repository,
    );

    expect(repository.applyMidtransPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "expire",
        orderStatus: "PAYMENT_EXPIRED",
      }),
    );
    expect(result.orderStatus).toBe("PAYMENT_EXPIRED");
  });
});
