import { describe, expect, it, vi } from "vitest";
import {
  PaymentSyncOrderNotFoundError,
  syncMidtransPaymentStatus,
  type MidtransStatusProvider,
  type PaymentSyncOrderSnapshot,
  type PaymentSyncRepository,
} from "@/application/payments/sync-midtrans-payment-status";

describe("syncMidtransPaymentStatus", () => {
  it("applies a paid Midtrans status and returns the refreshed order state", async () => {
    const pending: PaymentSyncOrderSnapshot = {
      id: "order-1",
      midtransOrderId: "ZB-ORDER-1",
      status: "PAYMENT_PENDING",
      paymentStatus: "pending",
    };
    const paid: PaymentSyncOrderSnapshot = {
      ...pending,
      status: "BARU",
      paymentStatus: "settlement",
    };
    const snapshots = [pending, paid];
    const repository: PaymentSyncRepository = {
      getOrderForUser: vi.fn(async () => snapshots.shift() ?? paid),
      applyMidtransPaymentEvent: vi.fn(async () => ({
        status: "processed",
        order_id: "order-1",
      })),
    };
    const midtrans: MidtransStatusProvider = {
      getTransactionStatus: vi.fn(async () => ({
        order_id: "ZB-ORDER-1",
        transaction_status: "settlement",
        transaction_id: "trx-1",
      })),
    };

    const result = await syncMidtransPaymentStatus(
      { orderId: "order-1", userId: "user-1" },
      { repository, midtrans },
    );

    expect(midtrans.getTransactionStatus).toHaveBeenCalledWith("ZB-ORDER-1");
    expect(repository.applyMidtransPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        midtransOrderId: "ZB-ORDER-1",
        paymentStatus: "settlement",
        orderStatus: "BARU",
      }),
    );
    expect(result.order.paymentStatus).toBe("settlement");
    expect(result.isPaid).toBe(true);
    expect(result.isPending).toBe(false);
  });

  it("rejects sync attempts for orders that do not belong to the user", async () => {
    const repository: PaymentSyncRepository = {
      getOrderForUser: vi.fn(async () => null),
      applyMidtransPaymentEvent: vi.fn(),
    };
    const midtrans: MidtransStatusProvider = {
      getTransactionStatus: vi.fn(),
    };

    await expect(
      syncMidtransPaymentStatus({ orderId: "order-1", userId: "user-1" }, { repository, midtrans }),
    ).rejects.toBeInstanceOf(PaymentSyncOrderNotFoundError);
    expect(midtrans.getTransactionStatus).not.toHaveBeenCalled();
  });

  it("returns terminal failed for expired Midtrans payments", async () => {
    const pending: PaymentSyncOrderSnapshot = {
      id: "order-1",
      midtransOrderId: "ZB-ORDER-1",
      status: "PAYMENT_PENDING",
      paymentStatus: "pending",
    };
    const expired: PaymentSyncOrderSnapshot = {
      ...pending,
      status: "PAYMENT_EXPIRED",
      paymentStatus: "expire",
    };
    const snapshots = [pending, expired];
    const repository: PaymentSyncRepository = {
      getOrderForUser: vi.fn(async () => snapshots.shift() ?? expired),
      applyMidtransPaymentEvent: vi.fn(async () => ({
        status: "processed",
        order_id: "order-1",
      })),
    };
    const midtrans: MidtransStatusProvider = {
      getTransactionStatus: vi.fn(async () => ({
        order_id: "ZB-ORDER-1",
        transaction_status: "expire",
      })),
    };

    const result = await syncMidtransPaymentStatus(
      { orderId: "order-1", userId: "user-1" },
      { repository, midtrans },
    );

    expect(repository.applyMidtransPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "expire",
        orderStatus: "PAYMENT_EXPIRED",
      }),
    );
    expect(result.order.status).toBe("PAYMENT_EXPIRED");
    expect(result.isTerminalFailed).toBe(true);
  });
});
