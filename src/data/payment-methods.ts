import type { PaymentMethod } from "@/types/database";

export const paymentMethods: PaymentMethod[] = [
  { id: "bank_transfer", name: "Bank Transfer (BCA)", type: "bank_transfer" },
  { id: "qris", name: "QRIS", type: "qris" },
];
