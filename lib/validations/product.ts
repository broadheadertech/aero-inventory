import { z } from "zod";

export const productSchema = z.object({
  styleCode: z
    .string()
    .min(1, "Style code is required")
    .max(50, "Style code must be 50 characters or less")
    .transform((val) => val.toUpperCase().trim()),
  name: z.string().min(1, "Description is required").max(200),
  department: z.string().min(1, "Department is required").max(100),
  // Allow empty string — converted to undefined before mutation call
  class: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required").max(100),
  subcategory: z.string().optional().or(z.literal("")),
  collection: z.string().min(1, "Collection is required").max(100),
  fabric: z.string().optional().or(z.literal("")),
  color: z.string().min(1, "Color is required").max(100),
  printApplication: z.string().optional().or(z.literal("")),
  // Accept pesos (decimal); use register({ valueAsNumber: true }) in the form
  // mutation call converts to centavos (×100)
  unitCost: z.number().min(0, "Cost cannot be negative"),
  retailPrice: z.number().min(0, "SRP cannot be negative"),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
