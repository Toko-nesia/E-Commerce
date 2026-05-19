import { describe, expect, it } from "vitest";
import {
  getValidAdminNextStatuses,
  getValidNextStatuses,
  isValidAdminTransition,
  isValidTransition,
  requiresCancelReason,
  requiresTrackingNumber,
} from "@/lib/order-status-utils";

describe("order status transitions", () => {
  it("does not let pending-payment orders enter seller processing", () => {
    expect(getValidNextStatuses("PAYMENT_PENDING")).toEqual([]);
    expect(getValidNextStatuses("PAYMENT_EXPIRED")).toEqual([]);
    expect(isValidTransition("PAYMENT_PENDING", "DIPROSES")).toBe(false);
    expect(isValidTransition("PAYMENT_PENDING", "DIKIRIM")).toBe(false);
    expect(isValidTransition("PAYMENT_EXPIRED", "DIPROSES")).toBe(false);
  });

  it("supports buyer and seller cancellation/refund statuses", () => {
    expect(getValidNextStatuses("DIPROSES")).toContain("CANCEL_REQUESTED");
    expect(getValidNextStatuses("DIPROSES")).toContain("CANCEL_APPROVED");
    expect(isValidTransition("CANCEL_APPROVED", "REFUND_INFO_SUBMITTED")).toBe(true);
    expect(isValidTransition("REFUND_INFO_SUBMITTED", "REFUNDED")).toBe(true);
  });

  it("keeps admin fulfillment actions separate from buyer refund flow", () => {
    expect(getValidAdminNextStatuses("DIPROSES")).toEqual(["DIKIRIM", "CANCEL_APPROVED"]);
    expect(getValidAdminNextStatuses("DIKIRIM")).toEqual([]);
    expect(isValidAdminTransition("DIKIRIM", "SELESAI")).toBe(false);
    expect(isValidAdminTransition("DIPROSES", "CANCEL_REQUESTED")).toBe(false);
  });

  it("requires a reason for seller cancellation and hard cancellation", () => {
    expect(requiresCancelReason("CANCEL_APPROVED")).toBe(true);
    expect(requiresCancelReason("DIBATALKAN")).toBe(true);
  });

  it("does not require tracking numbers for internal courier shipments", () => {
    expect(requiresTrackingNumber("DIKIRIM", "fedex")).toBe(true);
    expect(requiresTrackingNumber("DIKIRIM", "internal_courier")).toBe(false);
  });
});
