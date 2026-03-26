import { z } from "zod";

export const replenishmentRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required").max(100),
  scope: z.enum(["all", "category", "specific"], {
    required_error: "Scope is required",
  }),
  scopeFilter: z
    .object({
      department: z.string().optional(),
      category: z.string().optional(),
      productIds: z.array(z.string()).optional(),
    })
    .optional(),
  thresholdDays: z
    .number({ required_error: "Threshold days is required" })
    .int()
    .min(1, "Must be at least 1 day"),
  coverageDays: z
    .number({ required_error: "Coverage days is required" })
    .int()
    .min(1, "Must be at least 1 day"),
});

export type ReplenishmentRuleFormValues = z.infer<typeof replenishmentRuleSchema>;
