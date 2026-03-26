import { z } from "zod";

export const transferItemSchema = z.object({
  branchProductId: z.string().min(1, "Product selection is required"),
  // IMPORTANT: z.number() + register({ valueAsNumber: true }) — NOT z.coerce.number()
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export const transferRequestSchema = z.object({
  destinationBranchId: z.string().min(1, "Destination branch is required"),
  items: z
    .array(transferItemSchema)
    .min(1, "At least one product is required"),
});

export type TransferItemFormValues = z.infer<typeof transferItemSchema>;
export type TransferRequestFormValues = z.infer<typeof transferRequestSchema>;
