import { z } from "zod";

const ROLES = ["Admin", "Branch Manager", "Branch Staff"] as const;

const branchRefine = (data: { role: string; branchIds: string[] }) =>
  data.role === "Admin" || data.branchIds.length > 0;

const branchRefineMsg = {
  message:
    "Branch assignment is required for Branch Manager and Branch Staff roles",
  path: ["branchIds"],
};

export const createUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(ROLES),
    branchIds: z.array(z.string()),
  })
  .refine(branchRefine, branchRefineMsg);

export const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(ROLES),
    branchIds: z.array(z.string()),
  })
  .refine(branchRefine, branchRefineMsg);

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
