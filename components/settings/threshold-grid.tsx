"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImpactPreview } from "./impact-preview";
import {
  thresholdFormSchema,
  type ThresholdFormValues,
} from "@/lib/validations/threshold-form";

const PERIODS = ["daily", "weekly", "monthly", "quarterly"] as const;

export function ThresholdGrid() {
  const settings = useQuery(
    api.queries.getSettings.getSettings
  ) as Doc<"settings">[] | undefined;
  const updateThresholds = useMutation(
    api.mutations.updateThresholds.updateThresholds
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] =
    useState<ThresholdFormValues | null>(null);
  const [impactCount, setImpactCount] = useState(0);
  const [impactBranchCount, setImpactBranchCount] = useState(0);

  const form = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdFormSchema),
    mode: "onBlur",
    defaultValues: {
      daily: { fast: 1, slow: 0.2 },
      weekly: { fast: 5, slow: 1 },
      monthly: { fast: 20, slow: 5 },
      quarterly: { fast: 60, slow: 15 },
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = form;

  useEffect(() => {
    if (!settings) return;
    const parsed: ThresholdFormValues = {
      daily: { fast: 1, slow: 0.2 },
      weekly: { fast: 5, slow: 1 },
      monthly: { fast: 20, slow: 5 },
      quarterly: { fast: 60, slow: 15 },
    };
    for (const row of settings) {
      const p = row.timePeriod as keyof ThresholdFormValues;
      if (p in parsed) {
        parsed[p] = { fast: row.fastThreshold, slow: row.slowThreshold };
      }
    }
    reset(parsed);
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const lastModified = useMemo(() => {
    if (!settings || settings.length === 0) return null;
    const latest = settings
      .map((r) => r.updatedAt)
      .sort()
      .at(-1);
    if (!latest) return null;
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(latest));
  }, [settings]);

  const executeApply = async () => {
    if (!pendingSubmit) return;
    try {
      await Promise.all(
        PERIODS.map((p) =>
          updateThresholds({
            timePeriod: p,
            fastThreshold: pendingSubmit[p].fast,
            slowThreshold: pendingSubmit[p].slow,
          })
        )
      );
      toast.success(
        `Thresholds updated. ${impactCount} product${impactCount !== 1 ? "s" : ""} reclassified.`
      );
      reset(pendingSubmit);
      setPendingSubmit(null);
      setConfirmOpen(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update thresholds"
      );
      setConfirmOpen(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Sell-thru classification thresholds
            </caption>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32" />
                {PERIODS.map((p) => (
                  <th
                    key={p}
                    className="px-4 py-3 text-center font-medium text-muted-foreground capitalize"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Fast (≥ x%)", "Slow (≤ x%)"].map((label) => (
                <tr key={label} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    {label}
                  </td>
                  {PERIODS.map((p) => (
                    <td key={p} className="px-4 py-3 text-center">
                      <Skeleton className="h-8 w-20 mx-auto" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Sell-thru classification thresholds
          </caption>
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32" />
              {PERIODS.map((p) => (
                <th
                  key={p}
                  className="px-4 py-3 text-center font-medium text-muted-foreground capitalize"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Fast threshold row */}
            <tr className="border-b">
              <th
                scope="row"
                className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap text-left"
              >
                Fast (≥ x%)
              </th>
              {PERIODS.map((p) => (
                <td key={p} className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-20 rounded border px-2 py-1 text-right tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      {...register(`${p}.fast`, { valueAsNumber: true })}
                    />
                    {errors[p]?.fast && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors[p].fast?.message}
                      </p>
                    )}
                  </div>
                </td>
              ))}
            </tr>
            {/* Slow threshold row */}
            <tr>
              <th
                scope="row"
                className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap text-left"
              >
                Slow (≤ x%)
              </th>
              {PERIODS.map((p) => (
                <td key={p} className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-20 rounded border px-2 py-1 text-right tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      {...register(`${p}.slow`, { valueAsNumber: true })}
                    />
                    {errors[p]?.slow && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors[p].slow?.message}
                      </p>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Last modified: {lastModified ?? "Never"}
      </p>

      {isDirty && (
        <div className="flex items-center gap-3 mt-4">
          <Button
            type="button"
            onClick={handleSubmit((values) => {
              setPendingSubmit(values);
              setConfirmOpen(true);
            })}
            disabled={!isValid || isSubmitting}
          >
            Apply Changes
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

      {isDirty && isValid && (
        <div className="mt-6">
          <ImpactPreview
            pendingValues={watch()}
            onImpactChange={(total, branches) => {
              setImpactCount(total);
              setImpactBranchCount(branches);
            }}
          />
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply threshold changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reclassify {impactCount} product
              {impactCount !== 1 ? "s" : ""} across {impactBranchCount} branch
              {impactBranchCount !== 1 ? "es" : ""}. All sell-thru dashboards
              will reflect the new classifications immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeApply}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
