import { describe, expect, it } from "vitest";
import { getValidNextStatuses, isValidTransition, requiresCancelReason } from "@/lib/order-status-utils";

describe("order status transitions", () => {
  it("does not let pending-payment orders enter seller processing", () => {
    expect(getValidNextStatuses("PAYMENT_PENDING")).toEqual([]);
    expect(isValidTransition("PAYMENT_PENDING", "DIPROSES")).toBe(false);
    expect(isValidTransition("PAYMENT_PENDING", "DIKIRIM")).toBe(false);
  });

  it("supports buyer and seller cancellation/refund statuses", () => {
    expect(getValidNextStatuses("DIPROSES")).toContain("CANCEL_REQUESTED");
    expect(getValidNextStatuses("DIPROSES")).toContain("CANCEL_APPROVED");
    expect(isValidTransition("CANCEL_APPROVED", "REFUND_INFO_SUBMITTED")).toBe(true);
    expect(isValidTransition("REFUND_INFO_SUBMITTED", "REFUNDED")).toBe(true);
  });

  it("requires a reason for seller cancellation and hard cancellation", () => {
    expect(requiresCancelReason("CANCEL_APPROVED")).toBe(true);
    expect(requiresCancelReason("DIBATALKAN")).toBe(true);
  });
});
