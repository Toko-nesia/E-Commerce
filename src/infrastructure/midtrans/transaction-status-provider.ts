import MidtransClient from "midtrans-client";
import type { MidtransStatusProvider } from "@/application/payments/sync-midtrans-payment-status";

const coreApi = new MidtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
});

export class MidtransTransactionStatusProvider implements MidtransStatusProvider {
  async getTransactionStatus(midtransOrderId: string) {
    return await (coreApi as any).transaction.status(midtransOrderId);
  }
}
