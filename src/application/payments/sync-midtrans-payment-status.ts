import {
  applyMidtransNotification,
  type PaymentEventRepository,
  type VerifiedMidtransNotification,
} from "@/application/payments/apply-midtrans-notification";
import { isPaidPaymentStatus } from "@/domain/payment";

export interface PaymentSyncOrderSnapshot {
  id: string;
  midtransOrderId: string | null;
  status: string;
  paymentStatus: string;
}

export interface PaymentSyncRepository extends PaymentEventRepository {
  getOrderForUser(orderId: string, userId: string): Promise<PaymentSyncOrderSnapshot | null>;
}

export interface MidtransStatusProvider {
  getTransactionStatus(midtransOrderId: string): Promise<VerifiedMidtransNotification>;
}

export class PaymentSyncOrderNotFoundError extends Error {
  constructor() {
    super("Order not found.");
  }
}

export class PaymentSyncUnavailableError extends Error {
  constructor(message = "Payment status is temporarily unavailable.") {
    super(message);
  }
}

export async function syncMidtransPaymentStatus(
  input: {
    orderId: string;
    userId: string;
  },
  deps: {
    repository: PaymentSyncRepository;
    midtrans: MidtransStatusProvider;
  },
) {
  const order = await deps.repository.getOrderForUser(input.orderId, input.userId);
  if (!order) {
    throw new PaymentSyncOrderNotFoundError();
  }

  if (!order.midtransOrderId) {
    throw new PaymentSyncUnavailableError("Payment reference is missing.");
  }

  const statusPayload = await deps.midtrans.getTransactionStatus(order.midtransOrderId);
  const applied = await applyMidtransNotification(statusPayload, deps.repository);
  const updated = await deps.repository.getOrderForUser(input.orderId, input.userId);
  const current = updated ?? order;

  return {
    order: current,
    sync: applied,
    isPaid: isPaidPaymentStatus(current.paymentStatus),
    isPending: current.paymentStatus === "pending",
    isTerminalFailed: ["cancel", "deny", "expire", "failure"].includes(current.paymentStatus),
  };
}
