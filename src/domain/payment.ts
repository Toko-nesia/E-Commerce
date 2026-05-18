import { createHash } from "node:crypto";
import type { OrderStatus } from "@/domain/order-status";
export type { OrderStatus } from "@/domain/order-status";
export type PaymentStatus =
  | "pending"
  | "settlement"
  | "capture"
  | "cancel"
  | "deny"
  | "expire"
  | "failure"
  | "refund";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  settlement: "Paid",
  capture: "Paid",
  cancel: "Cancelled",
  deny: "Declined",
  expire: "Expired",
  failure: "Failed",
  refund: "Refunded",
};

export interface PaymentStatusMapping {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentStatusMapping | null {
  if (transactionStatus === "settlement") {
    return { orderStatus: "BARU", paymentStatus: "settlement" };
  }
  if (transactionStatus === "capture" && fraudStatus === "accept") {
    return { orderStatus: "BARU", paymentStatus: "capture" };
  }
  if (transactionStatus === "expire") {
    return { orderStatus: "PAYMENT_EXPIRED", paymentStatus: "expire" };
  }
  if (["cancel", "deny"].includes(transactionStatus)) {
    return { orderStatus: "DIBATALKAN", paymentStatus: transactionStatus as PaymentStatus };
  }
  if (transactionStatus === "failure") {
    return { orderStatus: "DIBATALKAN", paymentStatus: "failure" };
  }
  if (transactionStatus === "pending") {
    return { orderStatus: "PAYMENT_PENDING", paymentStatus: "pending" };
  }
  return null;
}

export function isPaidPaymentStatus(status: string | null | undefined): boolean {
  return status === "settlement" || status === "capture";
}

export function formatPaymentStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  return PAYMENT_STATUS_LABEL[status as PaymentStatus] ?? status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

export function createPaymentEventHash(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}
