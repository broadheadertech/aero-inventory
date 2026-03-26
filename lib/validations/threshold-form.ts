import { z } from "zod";

const periodSchema = z
  .object({
    fast: z
      .number({ error: "Required" })
      .min(0, "Min value is 0")
      .max(100, "Max value is 100"),
    slow: z
      .number({ error: "Required" })
      .min(0, "Min value is 0")
      .max(100, "Max value is 100"),
  })
  .refine((d) => d.fast > d.slow, {
    message: "Fast must be greater than Slow",
    path: ["fast"],
  });

export const thresholdFormSchema = z.object({
  daily: periodSchema,
  weekly: periodSchema,
  monthly: periodSchema,
  quarterly: periodSchema,
});

export type ThresholdFormValues = z.infer<typeof thresholdFormSchema>;
export type PeriodValues = z.infer<typeof periodSchema>;
