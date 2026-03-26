"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  alertSettingsFormSchema,
  type AlertSettingsFormValues,
} from "@/lib/validations/alert-settings-form";

const DEFAULT_VALUES: AlertSettingsFormValues = {
  minWeeksOnFloor: 4,
  minBranchesForNetworkAlert: 3,
  alertFrequency: "once",
};

export function AlertSettingsForm() {
  const alertSettings = useQuery(
    api.queries.getAlertSettings.getAlertSettings
  ) as Doc<"alertSettings"> | null | undefined;
  const updateAlertSettings = useMutation(
    api.mutations.updateAlertSettings.updateAlertSettings
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<AlertSettingsFormValues>({
    resolver: zodResolver(alertSettingsFormSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES,
  });

  // Ref to guard useEffect from resetting the form mid-save
  const isSubmittingRef = useRef(false);
  isSubmittingRef.current = isSubmitting;

  useEffect(() => {
    if (alertSettings === undefined) return;
    if (isSubmittingRef.current) return; // don't interrupt an in-flight save
    if (alertSettings === null) {
      reset(DEFAULT_VALUES);
      return;
    }
    reset({
      minWeeksOnFloor: alertSettings.minWeeksOnFloor,
      minBranchesForNetworkAlert: alertSettings.minBranchesForNetworkAlert,
      alertFrequency: alertSettings.alertFrequency,
    });
  }, [alertSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: AlertSettingsFormValues) {
    try {
      await updateAlertSettings(values);
      toast.success("Alert rules updated");
      reset(values);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update alert rules"
      );
    }
  }

  if (alertSettings === undefined) {
    return (
      <div className="space-y-4 max-w-sm">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="minWeeksOnFloor">Minimum weeks on floor</Label>
        <Input
          id="minWeeksOnFloor"
          type="number"
          min={1}
          step={1}
          {...register("minWeeksOnFloor", { valueAsNumber: true })}
        />
        {errors.minWeeksOnFloor && (
          <p className="text-xs text-destructive">
            {errors.minWeeksOnFloor.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Alert triggers only after a product has been on the floor for this
          many weeks (default: 4).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minBranchesForNetworkAlert">
          Minimum branches for network alert
        </Label>
        <Input
          id="minBranchesForNetworkAlert"
          type="number"
          min={1}
          step={1}
          {...register("minBranchesForNetworkAlert", { valueAsNumber: true })}
        />
        {errors.minBranchesForNetworkAlert && (
          <p className="text-xs text-destructive">
            {errors.minBranchesForNetworkAlert.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Network-wide alert triggers when the same product is Slow across this
          many branches (default: 3).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="alertFrequency">Alert frequency</Label>
        <Select
          value={watch("alertFrequency")}
          onValueChange={(val) =>
            setValue("alertFrequency", val as "once" | "weekly", {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger id="alertFrequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Once per product-branch</SelectItem>
            <SelectItem value="weekly">Weekly (re-alert every 7 days)</SelectItem>
          </SelectContent>
        </Select>
        {errors.alertFrequency && (
          <p className="text-xs text-destructive">
            {errors.alertFrequency.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
