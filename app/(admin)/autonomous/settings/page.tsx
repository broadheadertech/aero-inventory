"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, Percent, Package, Shuffle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const ACTION_LABELS: Record<string, { title: string; description: string; limitLabel: string; limitKey: string; icon: typeof Percent; example: string }> = {
  markdown: {
    title: "Markdown",
    description: "Auto-approve markdown proposals within limits",
    limitLabel: "Max Markdown %",
    limitKey: "maxMarkdownPercent",
    icon: Percent,
    example: "e.g. 20 means the system can auto-markdown up to 20% off without your approval",
  },
  replenishment: {
    title: "Replenishment",
    description: "Auto-execute replenishment suggestions within limits",
    limitLabel: "Max Replenishment Qty",
    limitKey: "maxReplenishmentQty",
    icon: Package,
    example: "e.g. 100 means the system can auto-transfer up to 100 units to restock a branch",
  },
  allocation: {
    title: "Allocation",
    description: "Auto-execute allocation recommendations within limits",
    limitLabel: "Max Allocation Qty",
    limitKey: "maxAllocationQty",
    icon: Shuffle,
    example: "e.g. 50 means the system can auto-allocate up to 50 units per branch",
  },
};

export default function GuardrailSettingsPage() {
  const { toast } = useToast();
  const data = useQuery(api.queries.getGuardrails.getGuardrails, {});
  const upsert = useMutation(api.mutations.autonomousGuardrails.upsertGuardrail);
  const toggleAll = useMutation(api.mutations.autonomousGuardrails.toggleAutonomousMode);

  const [saving, setSaving] = useState<string | null>(null);

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Autonomous Guardrails</h1></div>
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      </div>
    );
  }

  const handleSave = async (actionType: string, values: Record<string, unknown>) => {
    setSaving(actionType);
    try {
      await upsert({
        actionType,
        isEnabled: values.isEnabled as boolean,
        maxMarkdownPercent: values.maxMarkdownPercent as number | undefined,
        maxAllocationQty: values.maxAllocationQty as number | undefined,
        maxReplenishmentQty: values.maxReplenishmentQty as number | undefined,
        forecastVarianceTolerance: values.forecastVarianceTolerance as number | undefined,
      });
      toast({ title: `${ACTION_LABELS[actionType].title} guardrail saved` });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setSaving(null); }
  };

  const handleToggleAll = async (enabled: boolean) => {
    try {
      await toggleAll({ isEnabled: enabled });
      toast({ title: enabled ? "Autonomous mode enabled globally" : "Autonomous mode disabled globally" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/autonomous">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Autonomous Guardrails</h1>
            <p className="text-sm text-muted-foreground">Set the limits for what the system can do automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <ShieldCheck className={`h-5 w-5 ${data.globalEnabled ? "text-green-500" : "text-muted-foreground"}`} />
          <div className="text-right">
            <Label className="text-xs text-muted-foreground">Global Autonomous Mode</Label>
            <p className="text-xs font-medium">{data.globalEnabled ? "Enabled" : "Disabled"}</p>
          </div>
          <Switch checked={data.globalEnabled} onCheckedChange={handleToggleAll} />
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground mb-1">What are guardrails?</p>
        <p>Guardrails are safety limits you set for each type of automatic action. When the system wants to markdown a product, restock a branch, or allocate inventory, it checks these limits first. If the action is <strong>within your limits</strong>, it executes automatically. If it <strong>exceeds the limit</strong>, it gets flagged for your manual review in the Exception Queue.</p>
      </div>

      {/* Guardrail Cards */}
      <div className="space-y-4">
        {data.guardrails.map((g) => {
          const config = ACTION_LABELS[g.actionType];
          if (!config) return null;
          return (
            <GuardrailCard
              key={g.actionType}
              guardrail={g}
              config={config}
              saving={saving === g.actionType}
              globalDisabled={!data.globalEnabled}
              onSave={(values) => handleSave(g.actionType, values)}
            />
          );
        })}
      </div>
    </div>
  );
}

function GuardrailCard({
  guardrail,
  config,
  saving,
  globalDisabled,
  onSave,
}: {
  guardrail: Record<string, unknown>;
  config: { title: string; description: string; limitLabel: string; limitKey: string; icon: typeof Percent; example: string };
  saving: boolean;
  globalDisabled: boolean;
  onSave: (values: Record<string, unknown>) => void;
}) {
  const [isEnabled, setIsEnabled] = useState(guardrail.isEnabled as boolean);
  const [limitValue, setLimitValue] = useState(String((guardrail as Record<string, unknown>)[config.limitKey] ?? ""));
  const [varianceTolerance, setVarianceTolerance] = useState(String(guardrail.forecastVarianceTolerance ?? 15));

  useEffect(() => {
    setIsEnabled(guardrail.isEnabled as boolean);
    setLimitValue(String((guardrail as Record<string, unknown>)[config.limitKey] ?? ""));
    setVarianceTolerance(String(guardrail.forecastVarianceTolerance ?? 15));
  }, [guardrail, config.limitKey]);

  const handleSave = () => {
    onSave({
      isEnabled,
      [config.limitKey]: Number(limitValue) || undefined,
      forecastVarianceTolerance: Number(varianceTolerance) || undefined,
    });
  };

  const disabled = !isEnabled || globalDisabled;
  const Icon = config.icon;

  return (
    <Card className={`transition-opacity ${disabled ? "opacity-60" : ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isEnabled && !globalDisabled ? "bg-primary/10" : "bg-muted"}`}>
              <Icon className={`h-4 w-4 ${isEnabled && !globalDisabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base">{config.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} disabled={globalDisabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">{config.limitLabel}</Label>
            <Input
              type="number"
              min={1}
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              disabled={disabled}
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground">{config.example}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Forecast Variance Tolerance (%)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={varianceTolerance}
              onChange={(e) => setVarianceTolerance(e.target.value)}
              disabled={disabled}
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground">How much the actual result can differ from the forecast before flagging</p>
          </div>
        </div>
        <div className="flex justify-end border-t pt-3">
          <Button size="sm" onClick={handleSave} disabled={saving || globalDisabled}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
