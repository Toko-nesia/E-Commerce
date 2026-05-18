import { describe, expect, it } from "vitest";
import { buildEmailDedupeKey, buildWelcomeEmailDedupeKey, renderOrderEmail, renderWelcomeEmail } from "@/domain/notifications";

describe("notification domain", () => {
  it("creates stable dedupe keys per event recipient and order", () => {
    const left = buildEmailDedupeKey({
      eventType: "payment_succeeded",
      recipientEmail: "Buyer@Example.com",
      orderId: "order-1",
    });
    const right = buildEmailDedupeKey({
      eventType: "payment_succeeded",
      recipientEmail: "buyer@example.com",
      orderId: "order-1",
    });

    expect(left).toBe(right);
  });

  it("renders order email in English with tracking details", () => {
    const email = renderOrderEmail({
      eventType: "order_shipped",
      audience: "customer",
      orderId: "order-1",
      orderNumber: "#ORDER1",
      customerName: "Buyer",
      customerEmail: "buyer@example.com",
      total: "Rp150.000",
      status: "DIKIRIM",
      paymentStatus: "settlement",
      trackingNumber: "123456789012",
      estimatedDelivery: "3 business days",
    });

    expect(email.subject).toContain("shipped");
    expect(email.textContent).toContain("Tracking number: 123456789012");
    expect(email.textContent).toContain("Payment: Paid");
    expect(email.textContent).not.toContain("DIKIRIM");
    expect(email.textContent).not.toContain("settlement");
    expect(email.htmlContent).toContain("Your order is on its way");
  });

  it("renders welcome email and dedupes it by user", () => {
    const email = renderWelcomeEmail({ customerName: "Buyer" });

    expect(email.subject).toBe("Welcome to Tokonesia");
    expect(email.textContent).toContain("Your account is ready");
    expect(buildWelcomeEmailDedupeKey({ userId: "user-1" })).toBe(
      buildWelcomeEmailDedupeKey({ userId: "user-1" }),
    );
  });
});
