export interface OrderDetailStateInput {
  status: string | null | undefined;
  paymentStatus?: string | null;
  trackingNumber?: string | null;
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

  if (["CANCEL_REQUESTED", "CANCEL_APPROVED", "REFUND_INFO_SUBMITTED", "REFUNDED"].includes(input.status ?? "")) {
    return [
      {
        key: "refund-in-progress",
        label: "Cancellation & Refund",
        description: "Follow the refund section for the current manual refund step.",
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

  return [
    {
      key: "order-created",
      label: "Order Created",
      description: "Payment received, waiting for seller to start processing.",
      tone: "active",
    },
  ];
}
