import { z } from "zod";

export const shippingRateRequestSchema = z.object({
  addressId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    customAmountRaw: z.number().int().positive().nullable().optional(),
  })).min(1).max(100),
}).strict();
