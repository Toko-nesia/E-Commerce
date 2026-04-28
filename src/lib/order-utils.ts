// Pure order utility functions — used by API routes and property tests

export type OrderStatus = 'BARU' | 'DIPROSES' | 'DIKIRIM' | 'SELESAI' | 'DIBATALKAN';
export type PaymentStatus = 'pending' | 'settlement' | 'capture' | 'cancel' | 'deny' | 'expire' | 'failure';

/**
 * Maps a Midtrans transaction_status (and optional fraud_status) to the
 * corresponding order status and payment status.
 * Returns null for unrecognised statuses.
 */
export function mapPaymentStatusToOrderStatus(
  transactionStatus: string,
  fraudStatus?: string
): { orderStatus: OrderStatus; paymentStatus: PaymentStatus } | null {
  if (transactionStatus === 'settlement') {
    return { orderStatus: 'DIPROSES', paymentStatus: 'settlement' };
  }
  if (transactionStatus === 'capture' && fraudStatus === 'accept') {
    return { orderStatus: 'DIPROSES', paymentStatus: 'capture' };
  }
  if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
    return { orderStatus: 'DIBATALKAN', paymentStatus: transactionStatus as PaymentStatus };
  }
  if (transactionStatus === 'pending') {
    return { orderStatus: 'BARU', paymentStatus: 'pending' };
  }
  return null;
}

/**
 * Returns true when the order has already been settled and subsequent
 * webhook notifications should be ignored (idempotency guard).
 */
export function isIdempotent(currentPaymentStatus: string): boolean {
  return currentPaymentStatus === 'settlement';
}

/**
 * Builds the Midtrans itemDetails array from cart items, shipping cost, and
 * service fee. IMPORT_TAX is intentionally excluded.
 */
export function buildMidtransItemDetails(
  cartItems: Array<{ id: string; price: number; quantity: number; name: string }>,
  shippingCost: number,
  serviceFee: number
): Array<{ id: string; price: number; quantity: number; name: string }> {
  return [
    ...cartItems,
    { id: 'SHIPPING', price: shippingCost, quantity: 1, name: 'Air Shipping' },
    { id: 'SERVICE_FEE', price: serviceFee, quantity: 1, name: 'Service Fee' },
  ];
}

/** Format a raw integer (IDR) to a human-readable Rupiah string. */
export function formatRp(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}
