import { z } from "zod";

export const assignBranchProductSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  beginningStock: z
    .number()
    .int("BEG must be a whole number")
    .min(0, "BEG cannot be negative"),
  deliveryInStoreDate: z.string().optional().or(z.literal("")),
});

export type AssignBranchProductFormValues = z.infer<
  typeof assignBranchProductSchema
>;

export const updateBranchProductSchema = z.object({
  beginningStock: z
    .number()
    .int("BEG must be a whole number")
    .min(0, "BEG cannot be negative"),
  deliveryInStoreDate: z.string().optional().or(z.literal("")),
});

export type UpdateBranchProductFormValues = z.infer<
  typeof updateBranchProductSchema
>;
