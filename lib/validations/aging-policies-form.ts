import { z } from "zod";

export const agingPolicyRowSchema = z.object({
  classification: z.enum(["Slow", "Mid", "Fast"]),
  minWeeks: z
    .number({ error: "Required" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  maxWeeks: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .nullable(), // null = open-ended in the form
  recommendedAction: z.string().min(1, "Required"),
  priority: z.number().int().min(0),
});

export const agingPoliciesFormSchema = z
  .object({
    policies: z.array(agingPolicyRowSchema),
  })
  .superRefine((data, ctx) => {
    for (const cls of ["Slow", "Mid", "Fast"] as const) {
      const indexed = data.policies
        .map((p, i) => ({ ...p, originalIndex: i }))
        .filter((p) => p.classification === cls)
        .sort((a, b) => a.minWeeks - b.minWeeks);

      for (let i = 0; i < indexed.length - 1; i++) {
        const current = indexed[i];
        const next = indexed[i + 1];
        const currentMax = current.maxWeeks ?? Infinity;
        if (currentMax >= next.minWeeks) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Overlapping week ranges for ${cls} classification`,
            path: ["policies", current.originalIndex, "maxWeeks"],
          });
          break;
        }
      }
    }
  });

export type AgingPolicyRow = z.infer<typeof agingPolicyRowSchema>;
export type AgingPoliciesFormValues = z.infer<typeof agingPoliciesFormSchema>;
