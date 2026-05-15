export const ORDER_STATUSES = [
  "BARU",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
  "DIBATALKAN",
  "CANCEL_REQUESTED",
  "CANCEL_APPROVED",
  "REFUND_INFO_SUBMITTED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  BARU: "New",
  DIPROSES: "Processing",
  DIKIRIM: "Shipped",
  SELESAI: "Completed",
  DIBATALKAN: "Cancelled",
  CANCEL_REQUESTED: "Cancellation requested",
  CANCEL_APPROVED: "Cancellation approved",
  REFUND_INFO_SUBMITTED: "Refund details submitted",
  REFUNDED: "Refunded",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  BARU: "bg-[#FFF3CD] text-[#8a5a00]",
  DIPROSES: "bg-orange-50 text-orange-600",
  DIKIRIM: "bg-blue-50 text-blue-600",
  SELESAI: "bg-green-50 text-[#0f7a43]",
  DIBATALKAN: "bg-red-50 text-[#df0000]",
  CANCEL_REQUESTED: "bg-amber-50 text-amber-700",
  CANCEL_APPROVED: "bg-purple-50 text-purple-700",
  REFUND_INFO_SUBMITTED: "bg-indigo-50 text-indigo-700",
  REFUNDED: "bg-emerald-50 text-emerald-700",
};

export const REFUND_STATUSES = [
  "awaiting_seller_review",
  "rejected",
  "cancelled_by_buyer",
  "awaiting_buyer_payout",
  "awaiting_manual_transfer",
  "refunded",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  awaiting_seller_review: "Awaiting seller review",
  rejected: "Rejected",
  cancelled_by_buyer: "Cancelled by buyer",
  awaiting_buyer_payout: "Awaiting buyer payout details",
  awaiting_manual_transfer: "Awaiting manual transfer",
  refunded: "Refunded",
};

export type RefundInitiator = "buyer" | "seller";

export function isOrderStatus(value: string | null | undefined): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}
