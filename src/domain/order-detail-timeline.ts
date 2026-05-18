export interface OrderDetailStateInput {
  status: string | null | undefined;
  paymentStatus?: string | null;
  trackingNumber?: string | null;
  refund?: RefundTimelineInput | null;
}

export interface RefundTimelineInput {
  status: string | null | undefined;
  initiatedBy?: "buyer" | "seller" | null;
}

export interface OrderDetailLifecycleEvent {
  key: string;
  label: string;
  description: string;
  tone: "active" | "muted" | "danger";
}

export function isPendingPaymentOrder(input: OrderDetailStateInput): boolean {
  return input.status === "PAYMENT_PENDING" || input.paymentStatus === "pending";
}

export function shouldShowTrackingCard(input: OrderDetailStateInput): boolean {
  return Boolean(input.trackingNumber) || input.status === "DIKIRIM" || input.status === "SELESAI";
}

function orderCreatedEvent(): OrderDetailLifecycleEvent {
  return {
    key: "order-created",
    label: "Order Created",
    description: "Payment received, waiting for seller fulfillment.",
    tone: "muted",
  };
}

function getRefundLifecycleEvents(refund: RefundTimelineInput): OrderDetailLifecycleEvent[] {
  const initiatedBy = refund.initiatedBy ?? "buyer";
  const requestLabel = initiatedBy === "seller" ? "Seller Cancellation Started" : "Cancellation Requested";
  const requestDescription = initiatedBy === "seller"
    ? "The seller cancelled this order and requested your payout details."
    : "Your cancellation request was sent to the seller for review.";
  const requestEvent: OrderDetailLifecycleEvent = {
    key: "refund-requested",
    label: requestLabel,
    description: requestDescription,
    tone: "muted",
  };
  const approvedEvent: OrderDetailLifecycleEvent = {
    key: "refund-approved",
    label: "Cancellation Approved",
    description: "The order was cancelled and the reserved stock was returned.",
    tone: "muted",
  };
  const payoutEvent: OrderDetailLifecycleEvent = {
    key: "refund-payout-submitted",
    label: "Refund Details Submitted",
    description: "Your bank or e-wallet details were submitted for manual refund.",
    tone: "muted",
  };
  const manualTransferEvent: OrderDetailLifecycleEvent = {
    key: "refund-manual-transfer",
    label: "Manual Refund Transfer",
    description: "The seller is responsible for transferring the refund manually.",
    tone: "muted",
  };

  if (refund.status === "awaiting_seller_review") {
    return [{ ...requestEvent, tone: "active" }, orderCreatedEvent()];
  }

  if (refund.status === "cancelled_by_buyer") {
    return [
      {
        key: "refund-request-withdrawn",
        label: "Cancellation Request Withdrawn",
        description: "You withdrew the cancellation request. This order cannot be requested for cancellation again.",
        tone: "active",
      },
      requestEvent,
      orderCreatedEvent(),
    ];
  }

  if (refund.status === "rejected") {
    return [
      {
        key: "refund-rejected",
        label: "Cancellation Rejected",
        description: "The seller rejected the cancellation request and the order returned to its previous status.",
        tone: "danger",
      },
      requestEvent,
      orderCreatedEvent(),
    ];
  }

  if (refund.status === "awaiting_buyer_payout") {
    return [
      {
        key: "refund-awaiting-payout",
        label: "Refund Details Needed",
        description: "Submit your bank or e-wallet details so the seller can process the manual refund.",
        tone: "active",
      },
      approvedEvent,
      ...(initiatedBy === "buyer" ? [requestEvent] : []),
      orderCreatedEvent(),
    ];
  }

  if (refund.status === "awaiting_manual_transfer") {
    return [
      { ...manualTransferEvent, tone: "active" },
      payoutEvent,
      approvedEvent,
      ...(initiatedBy === "buyer" ? [requestEvent] : []),
      orderCreatedEvent(),
    ];
  }

  if (refund.status === "refunded") {
    return [
      {
        key: "refund-completed",
        label: "Refund Completed",
        description: "The seller marked the manual refund as completed.",
        tone: "active",
      },
      manualTransferEvent,
      payoutEvent,
      approvedEvent,
      ...(initiatedBy === "buyer" ? [requestEvent] : []),
      orderCreatedEvent(),
    ];
  }

  return [
    {
      key: "refund-in-progress",
      label: "Cancellation & Refund",
      description: "Follow the refund section for the current manual refund step.",
      tone: "active",
    },
    orderCreatedEvent(),
  ];
}

export function getOrderDetailLifecycleEvents(input: OrderDetailStateInput): OrderDetailLifecycleEvent[] {
  if (isPendingPaymentOrder(input)) {
    return [
      {
        key: "awaiting-payment",
        label: "Awaiting Payment",
        description: "Complete your Virtual Account payment before the payment window expires.",
        tone: "active",
      },
      {
        key: "order-created",
        label: "Order Created",
        description: "We reserved the items while waiting for payment.",
        tone: "muted",
      },
    ];
  }

  if (input.status === "PAYMENT_EXPIRED" || input.paymentStatus === "expire") {
    return [
      {
        key: "payment-expired",
        label: "Payment Expired",
        description: "The payment window expired, this transaction was cancelled, and reserved stock was returned.",
        tone: "danger",
      },
      {
        key: "order-created",
        label: "Order Created",
        description: "Items were reserved while waiting for payment.",
        tone: "muted",
      },
    ];
  }

  if (input.status === "DIBATALKAN") {
    return [
      {
        key: "order-cancelled",
        label: "Order Cancelled",
        description: "This order is no longer active.",
        tone: "danger",
      },
      {
        key: "order-created",
        label: "Order Created",
        description: "The order was created before it was cancelled.",
        tone: "muted",
      },
    ];
  }

  if (input.status === "DIPROSES") {
    return [
      {
        key: "order-processing",
        label: "Order Processing",
        description: "The seller is preparing your package.",
        tone: "active",
      },
      {
        key: "order-created",
        label: "Order Created",
        description: "Payment received, waiting for seller fulfillment.",
        tone: "muted",
      },
    ];
  }

  if (input.status === "DIKIRIM" || input.status === "SELESAI") {
    return [
      {
        key: "order-processing",
        label: "Order Processing",
        description: "The seller prepared your package for shipment.",
        tone: "muted",
      },
      {
        key: "order-created",
        label: "Order Created",
        description: "Payment received, waiting for seller fulfillment.",
        tone: "muted",
      },
    ];
  }

  if (input.refund || ["CANCEL_REQUESTED", "CANCEL_APPROVED", "REFUND_INFO_SUBMITTED", "REFUNDED"].includes(input.status ?? "")) {
    if (input.refund) return getRefundLifecycleEvents(input.refund);
    return [
      {
        key: "refund-in-progress",
        label: "Cancellation & Refund",
        description: "Follow the refund section for the current manual refund step.",
        tone: "active",
      },
      orderCreatedEvent(),
    ];
  }

  return [
    {
      key: "order-created",
      label: "Order Created",
      description: "Payment received, waiting for seller to start processing.",
      tone: "active",
    },
  ];
}
