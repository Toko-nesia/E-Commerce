import MidtransClient from "midtrans-client";
import type { PaymentGateway } from "@/application/checkout/create-checkout-intent";

const snap = new MidtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
});

export function formatMidtransExpiryStart(date: Date): string {
  const westernIndonesiaTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${westernIndonesiaTime.toISOString().slice(0, 19).replace("T", " ")} +0700`;
}

export class MidtransSnapPaymentGateway implements PaymentGateway {
  async createSnapTransaction(input: {
    midtransOrderId: string;
    grossAmount: number;
    customer: { name: string; phone: string };
    itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<{ token: string; redirectUrl: string }> {
    const parameter = {
      transaction_details: {
        order_id: input.midtransOrderId,
        gross_amount: input.grossAmount,
      },
      customer_details: {
        first_name: input.customer.name,
        phone: input.customer.phone,
      },
      item_details: input.itemDetails,
      enabled_payments: ["bank_transfer"],
      expiry: {
        start_time: formatMidtransExpiryStart(input.createdAt),
        unit: "hours",
        duration: Math.max(1, Math.ceil((input.expiresAt.getTime() - input.createdAt.getTime()) / (60 * 60 * 1000))),
      },
    };

    const transaction = await snap.createTransaction(parameter as any);

    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    };
  }
}
