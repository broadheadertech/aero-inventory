import { ThresholdGrid } from "@/components/settings/threshold-grid";

export default function ThresholdConfigurationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Threshold Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Set Fast and Slow mover classification thresholds for each time
          period.
        </p>
      </div>
      <ThresholdGrid />
    </div>
  );
}
