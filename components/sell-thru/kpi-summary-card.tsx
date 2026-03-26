import { Skeleton } from "@/components/ui/skeleton";

type ColorScheme = "neutral" | "fast" | "mid" | "slow";

const colorMap: Record<ColorScheme, { border: string; text: string; activeBorder: string }> = {
  neutral: { border: "border-border", text: "text-foreground", activeBorder: "border-foreground" },
  fast: { border: "border-fast", text: "text-fast", activeBorder: "border-fast" },
  mid: { border: "border-mid", text: "text-mid", activeBorder: "border-mid" },
  slow: { border: "border-slow", text: "text-slow", activeBorder: "border-slow" },
};

interface KpiSummaryCardProps {
  label: string;
  count: number | undefined;
  colorScheme: ColorScheme;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function KpiSummaryCard({ label, count, colorScheme, isActive, onClick, disabled }: KpiSummaryCardProps) {
  const colors = colorMap[colorScheme];
  const borderClass = isActive
    ? `border-2 ${colors.activeBorder} shadow-md`
    : `border ${colors.border} shadow-sm`;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`min-h-12 rounded-xl p-4 flex flex-col gap-1 bg-card transition-all text-left w-full ${borderClass} ${disabled ? "cursor-default" : "cursor-pointer"}`}
      aria-pressed={disabled ? undefined : isActive}
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {count === undefined ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>{count}</span>
      )}
    </button>
  );
}
