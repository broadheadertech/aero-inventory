"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  agingPoliciesFormSchema,
  type AgingPoliciesFormValues,
} from "@/lib/validations/aging-policies-form";

const CLASSIFICATIONS = ["Slow", "Mid", "Fast"] as const;

const DEFAULT_POLICIES: AgingPoliciesFormValues["policies"] = [
  { classification: "Slow", minWeeks: 1,  maxWeeks: 7,   recommendedAction: "Monitor",         priority: 0 },
  { classification: "Slow", minWeeks: 8,  maxWeeks: 15,  recommendedAction: "Markdown Now",    priority: 1 },
  { classification: "Slow", minWeeks: 16, maxWeeks: null, recommendedAction: "Urgent Markdown", priority: 2 },
  { classification: "Mid",  minWeeks: 8,  maxWeeks: null, recommendedAction: "Watch",           priority: 3 },
];

function policiesToFormValues(
  docs: Doc<"agingPolicies">[]
): AgingPoliciesFormValues["policies"] {
  return docs
    .sort((a, b) => a.priority - b.priority)
    .map((d) => ({
      classification: d.classification,
      minWeeks: d.minWeeks,
      maxWeeks: d.maxWeeks ?? null, // undefined (Convex) → null (form)
      recommendedAction: d.recommendedAction,
      priority: d.priority,
    }));
}

export function AgingPoliciesForm() {
  const agingPolicies = useQuery(
    api.queries.getAgingPolicies.getAgingPolicies
  ) as Doc<"agingPolicies">[] | undefined;
  const updateAgingPolicies = useMutation(
    api.mutations.updateAgingPolicies.updateAgingPolicies
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<AgingPoliciesFormValues>({
    resolver: zodResolver(agingPoliciesFormSchema),
    mode: "onBlur",
    defaultValues: { policies: DEFAULT_POLICIES },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "policies",
  });

  // Isolated per-field subscription — avoids full re-render on every form change
  const watchedPolicies = useWatch({ control, name: "policies" });

  // Ref to guard useEffect from resetting the form mid-save
  const isSubmittingRef = useRef(false);
  isSubmittingRef.current = isSubmitting;

  useEffect(() => {
    if (agingPolicies === undefined) return;
    if (isSubmittingRef.current) return;
    if (agingPolicies.length === 0) {
      reset({ policies: DEFAULT_POLICIES });
      return;
    }
    reset({ policies: policiesToFormValues(agingPolicies) });
  }, [agingPolicies]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: AgingPoliciesFormValues) {
    try {
      // Normalize priorities to display position (prevents collisions after remove+append)
      // Convert null (form) → undefined (Convex) for maxWeeks
      const policies = values.policies.map((p, i) => ({
        ...p,
        priority: i,
        maxWeeks: p.maxWeeks ?? undefined,
      }));
      await updateAgingPolicies({ policies });
      toast.success("Aging policies updated");
      reset(values);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update aging policies"
      );
    }
  }

  if (agingPolicies === undefined) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const policiesError = errors.policies;
  const globalError =
    policiesError && !Array.isArray(policiesError)
      ? (policiesError as { message?: string }).message
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {globalError && (
        <p className="text-sm text-destructive">{globalError}</p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">Aging policy rules</caption>
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Classification
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                Min Weeks
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                Max Weeks
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Recommended Action
              </th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Select
                    value={watchedPolicies[index]?.classification ?? "Slow"}
                    onValueChange={(val) =>
                      setValue(
                        `policies.${index}.classification`,
                        val as "Slow" | "Mid" | "Fast",
                        { shouldDirty: true }
                      )
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.policies?.[index]?.classification && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.policies[index].classification?.message}
                    </p>
                  )}
                </td>

                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="w-20 rounded border px-2 py-1 text-right tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    {...register(`policies.${index}.minWeeks`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.policies?.[index]?.minWeeks && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.policies[index].minWeeks?.message}
                    </p>
                  )}
                </td>

                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="∞"
                    className="w-20 rounded border px-2 py-1 text-right tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    {...register(`policies.${index}.maxWeeks`, {
                      setValueAs: (v) =>
                        v === "" || v === null ? null : Number(v),
                    })}
                  />
                  {errors.policies?.[index]?.maxWeeks && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.policies[index].maxWeeks?.message}
                    </p>
                  )}
                </td>

                <td className="px-3 py-2">
                  <Input
                    className="min-w-40"
                    {...register(`policies.${index}.recommendedAction`)}
                  />
                  {errors.policies?.[index]?.recommendedAction && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.policies[index].recommendedAction?.message}
                    </p>
                  )}
                </td>

                <td className="px-3 py-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                    aria-label="Remove row"
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            classification: "Slow",
            minWeeks: 1,
            maxWeeks: null,
            recommendedAction: "",
            priority: fields.length,
          })
        }
      >
        + Add Row
      </Button>

      {isDirty && (
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={!isDirty || !isValid || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isSubmitting}
          >
            Discard
          </Button>
        </div>
      )}
    </form>
  );
}
