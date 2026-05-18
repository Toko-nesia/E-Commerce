import {
  buildEmailDedupeKey,
  renderOrderEmail,
  type EmailAudience,
  type EmailEventType,
  type EmailRecipient,
} from "@/domain/notifications";
import { formatOrderStatus } from "@/domain/order-status";
import { formatPaymentStatus } from "@/domain/payment";
import { enqueueAndDispatchEmailEvent, type EmailEventDraft, type EmailEventRepository, type EmailProvider } from "./send-email-event";

export interface OrderNotificationSnapshot {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  total: string;
  status: string | null;
  paymentStatus: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  cancelReason: string | null;
}

export interface RefundNotificationSnapshot {
  id: string;
  reason: string | null;
  rejectionReason: string | null;
  refundAmount: string | null;
  payoutProvider: string | null;
}

export interface OrderNotificationDataRepository {
  getOrderSnapshot(orderId: string): Promise<OrderNotificationSnapshot | null>;
  getRefundSnapshot(refundRequestId: string): Promise<RefundNotificationSnapshot | null>;
  getAdminRecipients(): Promise<EmailRecipient[]>;
}

const ADMIN_EVENTS = new Set<EmailEventType>([
  "admin_new_paid_order",
  "admin_buyer_cancellation_requested",
  "admin_buyer_cancellation_withdrawn",
  "admin_buyer_payout_submitted",
]);

function orderNumber(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function getAudience(eventType: EmailEventType): EmailAudience {
  return ADMIN_EVENTS.has(eventType) ? "admin" : "customer";
}

function buildDraft(input: {
  eventType: EmailEventType;
  recipient: EmailRecipient;
  order: OrderNotificationSnapshot;
  refund: RefundNotificationSnapshot | null;
  audience: EmailAudience;
}): EmailEventDraft {
  const reason = input.refund?.rejectionReason
    || input.refund?.reason
    || input.order.cancelReason;
  const rendered = renderOrderEmail({
    eventType: input.eventType,
    audience: input.audience,
    orderId: input.order.id,
    orderNumber: orderNumber(input.order.id),
    customerName: input.order.customerName,
    customerEmail: input.order.customerEmail,
    total: input.order.total,
    status: formatOrderStatus(input.order.status),
    paymentStatus: formatPaymentStatus(input.order.paymentStatus),
    trackingNumber: input.order.trackingNumber,
    estimatedDelivery: input.order.estimatedDelivery,
    reason,
    refundAmount: input.refund?.refundAmount ?? null,
    payoutProvider: input.refund?.payoutProvider ?? null,
  });

  return {
    dedupeKey: buildEmailDedupeKey({
      eventType: input.eventType,
      recipientEmail: input.recipient.email,
      orderId: input.order.id,
      refundRequestId: input.refund?.id,
    }),
    eventType: input.eventType,
    audience: input.audience,
    recipientEmail: input.recipient.email,
    recipientName: input.recipient.name,
    subject: rendered.subject,
    htmlContent: rendered.htmlContent,
    textContent: rendered.textContent,
    tags: rendered.tags,
    payload: {
      eventType: input.eventType,
      orderId: input.order.id,
      refundRequestId: input.refund?.id ?? null,
      orderNumber: orderNumber(input.order.id),
    },
    orderId: input.order.id,
    refundRequestId: input.refund?.id ?? null,
    userId: input.audience === "customer" ? input.order.userId : null,
  };
}

export async function sendOrderEmailNotification(
  input: {
    eventType: EmailEventType;
    orderId: string;
    refundRequestId?: string | null;
  },
  deps: {
    dataRepository: OrderNotificationDataRepository;
    eventRepository: EmailEventRepository;
    provider: EmailProvider;
  },
): Promise<Array<{ status: "sent" | "failed" | "skipped"; eventId: string }>> {
  const order = await deps.dataRepository.getOrderSnapshot(input.orderId);
  if (!order) return [];

  const refund = input.refundRequestId
    ? await deps.dataRepository.getRefundSnapshot(input.refundRequestId)
    : null;
  const audience = getAudience(input.eventType);
  const recipients = audience === "admin"
    ? await deps.dataRepository.getAdminRecipients()
    : [{ email: order.customerEmail, name: order.customerName }];

  const validRecipients = recipients.filter((recipient) => recipient.email);
  const drafts = validRecipients.map((recipient) => buildDraft({
    eventType: input.eventType,
    recipient,
    order,
    refund,
    audience,
  }));

  return Promise.all(drafts.map((draft) => enqueueAndDispatchEmailEvent(draft, {
    repository: deps.eventRepository,
    provider: deps.provider,
  })));
}
