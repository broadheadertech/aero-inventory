import { z } from "zod";

export const alertSettingsFormSchema = z.object({
  minWeeksOnFloor: z
    .number({ error: "Required" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  minBranchesForNetworkAlert: z
    .number({ error: "Required" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
  alertFrequency: z.enum(["once", "weekly"]),
});

export type AlertSettingsFormValues = z.infer<typeof alertSettingsFormSchema>;
