import { createHash } from "node:crypto";

export type OrderStatus = "BARU" | "DIPROSES" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";
export type PaymentStatus =
  | "pending"
  | "settlement"
  | "capture"
  | "cancel"
  | "deny"
  | "expire"
  | "failure"
  | "refund";

export interface PaymentStatusMapping {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentStatusMapping | null {
  if (transactionStatus === "settlement") {
    return { orderStatus: "DIPROSES", paymentStatus: "settlement" };
  }
  if (transactionStatus === "capture" && fraudStatus === "accept") {
    return { orderStatus: "DIPROSES", paymentStatus: "capture" };
  }
  if (["cancel", "deny", "expire"].includes(transactionStatus)) {
    return { orderStatus: "DIBATALKAN", paymentStatus: transactionStatus as PaymentStatus };
  }
  if (transactionStatus === "failure") {
    return { orderStatus: "DIBATALKAN", paymentStatus: "failure" };
  }
  if (transactionStatus === "pending") {
    return { orderStatus: "BARU", paymentStatus: "pending" };
  }
  return null;
}

export function isPaidPaymentStatus(status: string | null | undefined): boolean {
  return status === "settlement" || status === "capture";
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
