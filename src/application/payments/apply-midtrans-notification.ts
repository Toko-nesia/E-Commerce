import { createPaymentEventHash, mapMidtransStatus } from "@/domain/payment";

export interface VerifiedMidtransNotification {
  order_id: string;
  transaction_status: string;
  transaction_id?: string;
  fraud_status?: string;
  [key: string]: unknown;
}

export interface PaymentEventRepository {
  applyMidtransPaymentEvent(input: {
    midtransOrderId: string;
    eventHash: string;
    eventType: string;
    transactionStatus: string;
    fraudStatus: string | null;
    paymentStatus: string;
    orderStatus: string;
    transactionId: string | null;
    payload: VerifiedMidtransNotification;
  }): Promise<unknown>;
}

export interface ApplyMidtransNotificationResult {
  status: string;
  orderId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  transactionStatus: string;
}

export async function applyMidtransNotification(
  notification: VerifiedMidtransNotification,
  repository: PaymentEventRepository,
): Promise<ApplyMidtransNotificationResult> {
  const mapping = mapMidtransStatus(notification.transaction_status, notification.fraud_status);

  if (!mapping) {
    return { status: "ignored_unknown_status", transactionStatus: notification.transaction_status };
  }

  const result = await repository.applyMidtransPaymentEvent({
    midtransOrderId: notification.order_id,
    eventHash: createPaymentEventHash(notification),
    eventType: "midtrans.notification",
    transactionStatus: notification.transaction_status,
    fraudStatus: notification.fraud_status ?? null,
    paymentStatus: mapping.paymentStatus,
    orderStatus: mapping.orderStatus,
    transactionId: notification.transaction_id ?? null,
    payload: notification,
  });

  const repositoryResult = (result ?? {}) as { status?: string; order_id?: string; orderId?: string };
  return {
    status: repositoryResult.status ?? "processed",
    orderId: repositoryResult.order_id ?? repositoryResult.orderId,
    paymentStatus: mapping.paymentStatus,
    orderStatus: mapping.orderStatus,
    transactionStatus: notification.transaction_status,
  };
}
