import { describe, expect, it } from "vitest";
import {
  getOrderDetailLifecycleEvents,
  isPendingPaymentOrder,
  shouldShowTrackingCard,
} from "@/domain/order-detail-timeline";

describe("order detail lifecycle", () => {
  it("shows a payment CTA state for pending-payment orders", () => {
    const events = getOrderDetailLifecycleEvents({ status: "PAYMENT_PENDING", paymentStatus: "pending" });

    expect(isPendingPaymentOrder({ status: "PAYMENT_PENDING", paymentStatus: "pending" })).toBe(true);
    expect(events[0]).toMatchObject({ key: "awaiting-payment", label: "Awaiting Payment" });
    expect(events.some((event) => event.label === "Order Processing")).toBe(false);
    expect(shouldShowTrackingCard({ status: "PAYMENT_PENDING", paymentStatus: "pending" })).toBe(false);
  });

  it("does not show processing for a new paid order", () => {
    const events = getOrderDetailLifecycleEvents({ status: "BARU", paymentStatus: "settlement" });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ key: "order-created", label: "Order Created" });
    expect(events[0].description).toContain("waiting for seller to start processing");
  });

  it("shows processing only after the seller changes the order status", () => {
    const events = getOrderDetailLifecycleEvents({ status: "DIPROSES", paymentStatus: "settlement" });

    expect(events[0]).toMatchObject({ key: "order-processing", label: "Order Processing" });
    expect(shouldShowTrackingCard({ status: "DIPROSES", paymentStatus: "settlement" })).toBe(false);
    expect(shouldShowTrackingCard({ status: "DIKIRIM", trackingNumber: "123456789012" })).toBe(true);
  });

  it("shows shipped and completed fallback events when persisted history is missing", () => {
    expect(getOrderDetailLifecycleEvents({ status: "DIKIRIM", paymentStatus: "settlement" })[0]).toMatchObject({
      key: "order-shipped",
      label: "Order Shipped",
    });
    expect(getOrderDetailLifecycleEvents({ status: "SELESAI", paymentStatus: "settlement" })[0]).toMatchObject({
      key: "order-completed",
      label: "Order Completed",
    });
  });

  it("shows expired payments as a terminal stock-release state", () => {
    const events = getOrderDetailLifecycleEvents({ status: "PAYMENT_EXPIRED", paymentStatus: "expire" });

    expect(events[0]).toMatchObject({ key: "payment-expired", label: "Payment Expired", tone: "danger" });
    expect(events[0].description).toContain("reserved stock was returned");
    expect(isPendingPaymentOrder({ status: "PAYMENT_EXPIRED", paymentStatus: "expire" })).toBe(false);
  });

  it("shows the full refund history through completed manual refund", () => {
    const events = getOrderDetailLifecycleEvents({
      status: "REFUNDED",
      paymentStatus: "refund",
      refund: { status: "refunded", initiatedBy: "buyer" },
    });

    expect(events.map((event) => event.label)).toEqual([
      "Refund Completed",
      "Manual Refund Transfer",
      "Refund Details Submitted",
      "Cancellation Approved",
      "Cancellation Requested",
      "Order Created",
    ]);
  });
});
