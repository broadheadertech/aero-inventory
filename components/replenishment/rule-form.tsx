"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  replenishmentRuleSchema,
  type ReplenishmentRuleFormValues,
} from "@/lib/validations/replenishment-rule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SCOPE_LABELS } from "@/components/replenishment/rule-constants";

type RuleFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: Doc<"replenishmentRules"> | null;
};

export function RuleForm({ open, onOpenChange, editingRule }: RuleFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRule = useMutation(api.mutations.createReplenishmentRule.createReplenishmentRule);
  const updateRule = useMutation(api.mutations.updateReplenishmentRule.updateReplenishmentRule);

  const form = useForm<ReplenishmentRuleFormValues>({
    resolver: zodResolver(replenishmentRuleSchema),
    defaultValues: {
      name: "",
      scope: "all",
      thresholdDays: 3,
      coverageDays: 5,
    },
  });

  useEffect(() => {
    if (editingRule) {
      form.reset({
        name: editingRule.name,
        scope: editingRule.scope,
        scopeFilter: editingRule.scopeFilter ?? undefined,
        thresholdDays: editingRule.thresholdDays,
        coverageDays: editingRule.coverageDays,
      });
    } else {
      form.reset({
        name: "",
        scope: "all",
        thresholdDays: 3,
        coverageDays: 5,
      });
    }
  }, [editingRule, form]);

  const watchScope = form.watch("scope");

  // Clear scopeFilter when scope changes away from "category"
  useEffect(() => {
    if (watchScope !== "category") {
      form.setValue("scopeFilter", undefined);
    }
  }, [watchScope, form]);

  const onSubmit = async (values: ReplenishmentRuleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingRule) {
        await updateRule({ ruleId: editingRule._id, ...values });
        toast({ title: "Rule updated successfully" });
      } else {
        await createRule(values);
        toast({ title: "Rule created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save rule",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Edit Replenishment Rule" : "Create Replenishment Rule"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fast movers restock" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Scope</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SCOPE_LABELS).map(([value, label]) => (
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

            {watchScope === "category" && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="scopeFilter.department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Women's" {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scopeFilter.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Tops" {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="thresholdDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SOH Threshold (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Alert when stock drops below this many days</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverageDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Suggest quantity for this many days of stock</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
