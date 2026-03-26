import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(100),
  contactName: z.string().min(1, "Contact name is required").max(100),
  contactEmail: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  leadTimeDays: z
    .number({ required_error: "Lead time is required" })
    .int()
    .min(1, "Must be at least 1 day"),
  productsSupplied: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
