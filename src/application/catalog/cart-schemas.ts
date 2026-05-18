import { z } from "zod";
import { positiveQuantitySchema } from "@/domain/validation";

export const cartResolveRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: positiveQuantitySchema,
    variantId: z.coerce.number().int().positive().nullable().optional(),
    customAmountRaw: z.coerce.number().int().positive().nullable().optional(),
    buyerNote: z.string().max(2000).nullable().optional(),
  })).max(100),
});

export type CartResolveRequest = z.infer<typeof cartResolveRequestSchema>;
