"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import {
  tradingEventSchema,
  type TradingEventFormValues,
} from "@/lib/validations/trading-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { EVENT_TYPE_LABELS } from "@/components/trading-calendar/event-constants";
import { Loader2, Plus, X } from "lucide-react";

type EventFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent?: Doc<"tradingEvents"> | null;
};

export function EventForm({ open, onOpenChange, editingEvent }: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEvent = useMutation(api.mutations.createTradingEvent.createTradingEvent);
  const updateEvent = useMutation(api.mutations.updateTradingEvent.updateTradingEvent);

  const form = useForm<TradingEventFormValues>({
    resolver: zodResolver(tradingEventSchema),
    defaultValues: editingEvent
      ? {
          name: editingEvent.name,
          description: editingEvent.description,
          eventType: editingEvent.eventType,
          startDate: editingEvent.startDate,
          endDate: editingEvent.endDate,
          actions: editingEvent.actions,
          reminderDaysBefore: editingEvent.reminderDaysBefore ?? undefined,
          linkedBranchIds: editingEvent.linkedBranchIds as string[],
          linkedProductFilters: editingEvent.linkedProductFilters ?? undefined,
        }
      : {
          name: "",
          description: "",
          eventType: "collection_launch",
          startDate: "",
          endDate: "",
          actions: [],
          linkedBranchIds: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions",
  });

  useEffect(() => {
    if (editingEvent) {
      form.reset({
        name: editingEvent.name,
        description: editingEvent.description,
        eventType: editingEvent.eventType,
        startDate: editingEvent.startDate,
        endDate: editingEvent.endDate,
        actions: editingEvent.actions,
        reminderDaysBefore: editingEvent.reminderDaysBefore ?? undefined,
        linkedBranchIds: editingEvent.linkedBranchIds as string[],
        linkedProductFilters: editingEvent.linkedProductFilters ?? undefined,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        eventType: "collection_launch",
        startDate: "",
        endDate: "",
        actions: [],
        linkedBranchIds: [],
      });
    }
  }, [editingEvent, form]);

  const onSubmit = async (values: TradingEventFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await updateEvent({
          eventId: editingEvent._id,
          ...values,
          linkedBranchIds: values.linkedBranchIds as Id<"branches">[],
        });
        toast({ title: "Event updated successfully" });
      } else {
        await createEvent({
          ...values,
          linkedBranchIds: values.linkedBranchIds as Id<"branches">[],
        });
        toast({ title: "Event created successfully" });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? "Edit Trading Event" : "Create Trading Event"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Collection Launch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the event and planned actions..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Action Triggers</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ type: "markdown", value: "", description: "" })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Action
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No actions attached. Add actions to trigger on this event.
                </p>
              )}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-2 rounded-md border p-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`actions.${index}.type`}
                        render={({ field: f }) => (
                          <FormItem>
                            <Select
                              onValueChange={f.onChange}
                              value={f.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="markdown">
                                  Markdown
                                </SelectItem>
                                <SelectItem value="allocation">
                                  Allocation
                                </SelectItem>
                                <SelectItem value="reminder">
                                  Reminder
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.value`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="e.g. 20%" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`actions.${index}.description`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Description (optional)"
                              {...f}
                              value={f.value ?? ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1 shrink-0"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="reminderDaysBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder (days before)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      placeholder="e.g. 3"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
