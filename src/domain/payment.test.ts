import { describe, expect, it } from "vitest";
import { createPaymentEventHash, formatPaymentStatus, isPaidPaymentStatus, mapMidtransStatus } from "@/domain/payment";

describe("payment domain", () => {
  it("maps paid Midtrans statuses to the new paid order state", () => {
    expect(mapMidtransStatus("settlement")).toEqual({
      orderStatus: "BARU",
      paymentStatus: "settlement",
    });
    expect(mapMidtransStatus("capture", "accept")).toEqual({
      orderStatus: "BARU",
      paymentStatus: "capture",
    });
  });

  it("maps terminal failed statuses without treating them as paid", () => {
    expect(mapMidtransStatus("expire")).toEqual({
      orderStatus: "DIBATALKAN",
      paymentStatus: "expire",
    });
    expect(isPaidPaymentStatus("expire")).toBe(false);
    expect(isPaidPaymentStatus("settlement")).toBe(true);
  });

  it("keeps pending Midtrans payments out of the seller workflow", () => {
    expect(mapMidtransStatus("pending")).toEqual({
      orderStatus: "PAYMENT_PENDING",
      paymentStatus: "pending",
    });
  });

  it("formats payment statuses for customer-facing copy", () => {
    expect(formatPaymentStatus("pending")).toBe("Awaiting payment");
    expect(formatPaymentStatus("settlement")).toBe("Paid");
    expect(formatPaymentStatus("CANCEL_REQUESTED")).toBe("Cancel Requested");
  });

  it("uses stable nested hashes for duplicate webhook detection", () => {
    const left = {
      order_id: "ZB-1",
      transaction_status: "settlement",
      nested: { b: 2, a: 1 },
    };
    const right = {
      nested: { a: 1, b: 2 },
      transaction_status: "settlement",
      order_id: "ZB-1",
    };

    expect(createPaymentEventHash(left)).toBe(createPaymentEventHash(right));
  });
});
