import { z } from "zod";

// IMPORTANT: use z.number() + register({ valueAsNumber: true }) — NOT z.coerce.number()
// z.coerce.number() causes TS2322 zodResolver incompatibility
export const updateSalesEntrySchema = z.object({
  quantitySold: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  notes: z.string().optional().or(z.literal("")),
});

export type UpdateSalesEntryFormValues = z.infer<typeof updateSalesEntrySchema>;
