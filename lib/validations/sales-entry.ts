import { z } from "zod";

export const salesEntrySchema = z.object({
  branchProductId: z.string().min(1, "Product selection is required"),
  // IMPORTANT: z.number() + register({ valueAsNumber: true }) — NOT z.coerce.number()
  quantitySold: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  // Optional salePrice override — stored in centavos
  // For MVP: if not provided, mutation defaults to retailPrice
  salePrice: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export type SalesEntryFormValues = z.infer<typeof salesEntrySchema>;
