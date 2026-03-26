import { z } from "zod";

export const tradingEventActionSchema = z.object({
  type: z.string().min(1, "Action type is required"),
  value: z.string().min(1, "Action value is required"),
  description: z.string().optional(),
});

export const tradingEventSchema = z
  .object({
    name: z.string().min(1, "Event name is required").max(100),
    description: z.string().min(1, "Description is required").max(500),
    eventType: z.enum(["collection_launch", "markdown", "promotion"], {
      required_error: "Event type is required",
    }),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    actions: z.array(tradingEventActionSchema).default([]),
    reminderDaysBefore: z
      .number()
      .int()
      .min(0)
      .max(90)
      .optional(),
    linkedBranchIds: z.array(z.string()).default([]),
    linkedProductFilters: z
      .object({
        department: z.string().optional(),
        category: z.string().optional(),
        collection: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type TradingEventFormValues = z.infer<typeof tradingEventSchema>;
