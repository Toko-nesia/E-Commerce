// Pure order status transition utilities — used by admin pages and property tests

export type OrderStatus = 'BARU' | 'DIPROSES' | 'DIKIRIM' | 'SELESAI' | 'DIBATALKAN';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  BARU: ['DIPROSES', 'DIBATALKAN'],
  DIPROSES: ['DIKIRIM', 'DIBATALKAN'],
  DIKIRIM: ['SELESAI'],
  SELESAI: [],
  DIBATALKAN: [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function requiresTrackingNumber(to: OrderStatus): boolean {
  return to === 'DIKIRIM';
}

export function requiresCancelReason(to: OrderStatus): boolean {
  return to === 'DIBATALKAN';
}
