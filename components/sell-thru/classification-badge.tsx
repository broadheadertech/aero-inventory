type Classification = "Fast" | "Mid" | "Slow" | "N/A";

const classMap: Record<Classification, string> = {
  Fast: "bg-fast text-fast-text",
  Mid: "bg-mid text-mid-text",
  Slow: "bg-slow text-slow-text",
  "N/A": "bg-muted text-muted-foreground",
};

interface ClassificationBadgeProps {
  classification: Classification;
}

export function ClassificationBadge({ classification }: ClassificationBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${classMap[classification]}`}
      aria-label={`Classification: ${classification}`}
    >
      {classification}
    </span>
  );
}
