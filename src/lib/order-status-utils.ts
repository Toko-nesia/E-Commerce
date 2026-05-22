// Pure order status transition utilities — used by admin pages and property tests

import type { OrderStatus } from "@/domain/order-status";
export type { OrderStatus } from "@/domain/order-status";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: [],
  PAYMENT_EXPIRED: [],
  BARU: ["DIPROSES", "CANCEL_REQUESTED", "CANCEL_APPROVED", "DIBATALKAN"],
  DIPROSES: ["DIKIRIM", "CANCEL_REQUESTED", "CANCEL_APPROVED", "DIBATALKAN"],
  DIKIRIM: ["SELESAI"],
  SELESAI: [],
  CANCEL_REQUESTED: ["BARU", "DIPROSES", "CANCEL_APPROVED"],
  CANCEL_APPROVED: ["REFUND_INFO_SUBMITTED"],
  REFUND_INFO_SUBMITTED: ["REFUNDED"],
  REFUNDED: [],
  DIBATALKAN: [],
};

const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: [],
  PAYMENT_EXPIRED: [],
  BARU: ["DIPROSES", "CANCEL_APPROVED"],
  DIPROSES: ["DIKIRIM", "CANCEL_APPROVED"],
  DIKIRIM: [],
  SELESAI: [],
  CANCEL_REQUESTED: [],
  CANCEL_APPROVED: [],
  REFUND_INFO_SUBMITTED: [],
  REFUNDED: [],
  DIBATALKAN: [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function isValidAdminTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ADMIN_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidAdminNextStatuses(current: OrderStatus): OrderStatus[] {
  return ADMIN_TRANSITIONS[current] ?? [];
}

export function requiresTrackingNumber(to: OrderStatus, shippingMethod?: string | null): boolean {
  return to === "DIKIRIM" && shippingMethod !== "internal_courier";
}

export function requiresCancelReason(to: OrderStatus): boolean {
  return to === "DIBATALKAN" || to === "CANCEL_APPROVED";
}
