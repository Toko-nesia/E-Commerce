import { createHash } from "node:crypto";

export const EMAIL_EVENT_TYPES = [
  "customer_welcome",
  "payment_pending",
  "payment_succeeded",
  "payment_failed",
  "payment_expired",
  "order_shipped",
  "order_completed",
  "order_cancelled",
  "buyer_cancellation_requested",
  "buyer_cancellation_withdrawn",
  "seller_cancellation_approved",
  "buyer_cancellation_rejected",
  "buyer_payout_submitted",
  "refund_completed",
  "admin_new_paid_order",
  "admin_buyer_cancellation_requested",
  "admin_buyer_cancellation_withdrawn",
  "admin_buyer_payout_submitted",
] as const;

export type EmailEventType = (typeof EMAIL_EVENT_TYPES)[number];
export type EmailAudience = "customer" | "admin";

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface OrderEmailTemplateData {
  eventType: EmailEventType;
  audience: EmailAudience;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: string;
  status?: string | null;
  paymentStatus?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  reason?: string | null;
  refundAmount?: string | null;
  payoutProvider?: string | null;
}

export interface WelcomeEmailTemplateData {
  customerName: string;
}

export interface RenderedEmail {
  subject: string;
  htmlContent: string;
  textContent: string;
  tags: string[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "-";
}

function line(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function readableLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const known: Record<string, string> = {
    PAYMENT_PENDING: "Pending payment",
    BARU: "New",
    DIPROSES: "Processing",
    DIKIRIM: "Shipped",
    SELESAI: "Completed",
    DIBATALKAN: "Cancelled",
    CANCEL_REQUESTED: "Cancellation requested",
    CANCEL_APPROVED: "Cancellation approved",
    REFUND_INFO_SUBMITTED: "Refund details submitted",
    REFUNDED: "Refunded",
    pending: "Awaiting payment",
    settlement: "Paid",
    capture: "Paid",
    cancel: "Cancelled",
    deny: "Declined",
    expire: "Expired",
    failure: "Failed",
    refund: "Refunded",
  };
  return known[value] ?? value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

const SUBJECTS: Record<EmailEventType, string> = {
  customer_welcome: "Welcome to Tokonesia",
  payment_pending: "Your Tokonesia payment is waiting",
  payment_succeeded: "Payment received for your Tokonesia order",
  payment_failed: "Your Tokonesia payment could not be completed",
  payment_expired: "Your Tokonesia payment expired",
  order_shipped: "Your Tokonesia order has shipped",
  order_completed: "Your Tokonesia order is complete",
  order_cancelled: "Your Tokonesia order was cancelled",
  buyer_cancellation_requested: "Your cancellation request was submitted",
  buyer_cancellation_withdrawn: "Your cancellation request was withdrawn",
  seller_cancellation_approved: "Your cancellation was approved",
  buyer_cancellation_rejected: "Your cancellation request was rejected",
  buyer_payout_submitted: "Your refund payout details were submitted",
  refund_completed: "Your Tokonesia refund is complete",
  admin_new_paid_order: "New paid Tokonesia order",
  admin_buyer_cancellation_requested: "Cancellation request needs review",
  admin_buyer_cancellation_withdrawn: "Cancellation request withdrawn",
  admin_buyer_payout_submitted: "Refund payout details submitted",
};

const HEADLINES: Record<EmailEventType, string> = {
  customer_welcome: "Welcome to Tokonesia",
  payment_pending: "Please complete your payment",
  payment_succeeded: "Payment confirmed",
  payment_failed: "Payment failed",
  payment_expired: "Payment expired",
  order_shipped: "Your order is on its way",
  order_completed: "Order completed",
  order_cancelled: "Order cancelled",
  buyer_cancellation_requested: "Cancellation request submitted",
  buyer_cancellation_withdrawn: "Cancellation request withdrawn",
  seller_cancellation_approved: "Cancellation approved",
  buyer_cancellation_rejected: "Cancellation rejected",
  buyer_payout_submitted: "Payout details received",
  refund_completed: "Refund completed",
  admin_new_paid_order: "A customer has paid",
  admin_buyer_cancellation_requested: "A buyer requested cancellation",
  admin_buyer_cancellation_withdrawn: "A buyer withdrew cancellation",
  admin_buyer_payout_submitted: "Buyer submitted payout details",
};

const DESCRIPTIONS: Record<EmailEventType, string> = {
  customer_welcome: "Your account is ready. You can now shop Indonesian goods for delivery to Japan.",
  payment_pending: "We created your order and are waiting for payment confirmation.",
  payment_succeeded: "Your payment has been confirmed. We will start processing your order.",
  payment_failed: "The payment attempt for this order was not completed successfully.",
  payment_expired: "The payment window for this order has expired.",
  order_shipped: "Your package has been handed over for delivery.",
  order_completed: "This order has been marked as completed.",
  order_cancelled: "This order has been cancelled.",
  buyer_cancellation_requested: "Your request is waiting for seller review.",
  buyer_cancellation_withdrawn: "You withdrew the request before seller review.",
  seller_cancellation_approved: "Please submit your bank or e-wallet details so the seller can process the refund manually.",
  buyer_cancellation_rejected: "The seller rejected this cancellation request.",
  buyer_payout_submitted: "Your payout details have been received and are waiting for manual transfer.",
  refund_completed: "The seller has marked your manual refund as completed.",
  admin_new_paid_order: "A paid order is ready to process.",
  admin_buyer_cancellation_requested: "A buyer cancellation request is waiting for review.",
  admin_buyer_cancellation_withdrawn: "The buyer withdrew a cancellation request before review.",
  admin_buyer_payout_submitted: "The buyer submitted payout details for a manual refund.",
};

export function buildEmailDedupeKey(input: {
  eventType: EmailEventType;
  recipientEmail: string;
  orderId?: string | null;
  refundRequestId?: string | null;
  userId?: string | null;
}): string {
  const raw = [
    input.eventType,
    input.recipientEmail.trim().toLowerCase(),
    input.orderId ?? "",
    input.refundRequestId ?? "",
    input.userId ?? "",
  ].join(":");
  return createHash("sha256").update(raw).digest("hex");
}

export function buildWelcomeEmailDedupeKey(input: { userId: string }): string {
  return createHash("sha256").update(`welcome:user:${input.userId}`).digest("hex");
}

export function renderWelcomeEmail(data: WelcomeEmailTemplateData): RenderedEmail {
  const name = data.customerName.trim() || "there";
  const subject = SUBJECTS.customer_welcome;
  const headline = HEADLINES.customer_welcome;
  const description = DESCRIPTIONS.customer_welcome;
  const htmlContent = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fdf9f5;color:#2f251d;font-family:Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #eadfd4;border-radius:8px;padding:28px;">
        <p style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#8a6b5a;margin:0 0 10px;">Tokonesia</p>
        <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;color:#2f251d;">${escapeHtml(headline)}</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#605850;">Hi ${escapeHtml(name)},</p>
        <p style="font-size:14px;line-height:1.6;margin:0;color:#605850;">${escapeHtml(description)}</p>
      </div>
    </div>
  </body>
</html>`;
  const textContent = [
    headline,
    `Hi ${name},`,
    description,
  ].join("\n");

  return {
    subject,
    htmlContent,
    textContent,
    tags: ["tokonesia", "customer_welcome", "customer"],
  };
}

export function renderOrderEmail(data: OrderEmailTemplateData): RenderedEmail {
  const subject = SUBJECTS[data.eventType];
  const headline = HEADLINES[data.eventType];
  const description = DESCRIPTIONS[data.eventType];
  const status = readableLabel(data.status);
  const paymentStatus = readableLabel(data.paymentStatus);
  const htmlContent = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fdf9f5;color:#2f251d;font-family:Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #eadfd4;border-radius:8px;padding:28px;">
        <p style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#8a6b5a;margin:0 0 10px;">Tokonesia</p>
        <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;color:#2f251d;">${escapeHtml(headline)}</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#605850;">${escapeHtml(description)}</p>
        <div style="font-size:14px;line-height:1.6;background:#fdf9f5;border:1px solid #eadfd4;border-radius:8px;padding:16px;">
          ${line("Order", data.orderNumber)}
          ${line("Customer", data.audience === "admin" ? `${data.customerName} (${data.customerEmail})` : data.customerName)}
          ${line("Total", money(data.total))}
          ${line("Status", status)}
          ${line("Payment", paymentStatus)}
          ${line("Tracking number", data.trackingNumber)}
          ${line("Estimated delivery", data.estimatedDelivery)}
          ${line("Reason", data.reason)}
          ${line("Refund amount", data.refundAmount)}
          ${line("Payout provider", data.payoutProvider)}
        </div>
      </div>
    </div>
  </body>
</html>`;

  const textContent = [
    headline,
    description,
    `Order: ${data.orderNumber}`,
    `Customer: ${data.customerName}`,
    `Total: ${money(data.total)}`,
    status ? `Status: ${status}` : "",
    paymentStatus ? `Payment: ${paymentStatus}` : "",
    data.trackingNumber ? `Tracking number: ${data.trackingNumber}` : "",
    data.estimatedDelivery ? `Estimated delivery: ${data.estimatedDelivery}` : "",
    data.reason ? `Reason: ${data.reason}` : "",
    data.refundAmount ? `Refund amount: ${data.refundAmount}` : "",
    data.payoutProvider ? `Payout provider: ${data.payoutProvider}` : "",
  ].filter(Boolean).join("\n");

  return {
    subject,
    htmlContent,
    textContent,
    tags: ["tokonesia", data.eventType, data.audience],
  };
}
