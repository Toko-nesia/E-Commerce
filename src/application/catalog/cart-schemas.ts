import { z } from "zod";
import { positiveQuantitySchema } from "@/domain/validation";

export const cartResolveRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: positiveQuantitySchema,
  })).max(100),
});

export type CartResolveRequest = z.infer<typeof cartResolveRequestSchema>;

