import { describe, expect, it } from "vitest";
import { createPaymentEventHash, isPaidPaymentStatus, mapMidtransStatus } from "@/domain/payment";

describe("payment domain", () => {
  it("maps paid Midtrans statuses to the processing order state", () => {
    expect(mapMidtransStatus("settlement")).toEqual({
      orderStatus: "DIPROSES",
      paymentStatus: "settlement",
    });
    expect(mapMidtransStatus("capture", "accept")).toEqual({
      orderStatus: "DIPROSES",
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
