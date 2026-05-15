import { z } from "zod";
import { phoneNumberSchema } from "@/domain/validation";

export const cancellationReasonSchema = z.string().trim().min(5).max(500);

export const createBuyerCancellationSchema = z.object({
  reason: cancellationReasonSchema,
});

export const createSellerCancellationSchema = z.object({
  reason: cancellationReasonSchema,
});

export const reviewRefundSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    note: z.string().trim().max(500).optional().default(""),
  }),
  z.object({
    action: z.literal("reject"),
    rejectionReason: cancellationReasonSchema,
  }),
]);

export const payoutSchema = z.object({
  refundMethod: z.enum(["bank_transfer", "e_wallet"]),
  payoutProvider: z.string().trim().min(2).max(80),
  accountName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(3).max(120),
  phone: phoneNumberSchema.optional(),
});

export const markRefundedSchema = z.object({
  transferNote: z.string().trim().max(500).optional().default(""),
});

