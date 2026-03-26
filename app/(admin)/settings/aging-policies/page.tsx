import { AgingPoliciesForm } from "@/components/settings/aging-policies-form";

export default function AgingPoliciesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Aging Policies
        </h1>
        <p className="text-sm text-muted-foreground">
          Define week-range thresholds and recommended actions for each
          inventory classification.
        </p>
      </div>
      <AgingPoliciesForm />
    </div>
  );
}
