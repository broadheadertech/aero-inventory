import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(100),
  code: z
    .string()
    .min(1, "Branch code is required")
    .max(20, "Code must be 20 characters or less")
    .transform((val) => val.toUpperCase().trim()),
  address: z.string().min(1, "Address is required").max(200),
  // Allow empty string — converted to undefined before mutation call
  phone: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
  type: z.enum(["branch", "warehouse"]),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
