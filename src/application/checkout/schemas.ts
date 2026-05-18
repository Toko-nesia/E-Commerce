import { z } from "zod";

export const checkoutIntentItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(999),
  variantId: z.coerce.number().int().positive().nullable().optional(),
  customAmountRaw: z.coerce.number().int().positive().nullable().optional(),
  buyerNote: z.string().max(2000).nullable().optional(),
});

export const createCheckoutIntentSchema = z.object({
  idempotencyKey: z.string().trim().min(16).max(128),
  addressId: z.string().uuid(),
  note: z.string().trim().max(500).optional().default(""),
  items: z.array(checkoutIntentItemSchema).min(1).max(100),
});

export type CreateCheckoutIntentRequest = z.infer<typeof createCheckoutIntentSchema>;
