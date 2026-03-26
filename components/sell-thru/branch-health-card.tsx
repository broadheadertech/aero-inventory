"use client";

interface BranchHealthCardProps {
  branchId: string;
  branchName: string;
  fastCount: number;
  midCount: number;
  slowCount: number;
  total: number;
  isWarehouse?: boolean;
  onClick: () => void;
}

export function BranchHealthCard({
  branchId: _branchId,
  branchName,
  fastCount,
  midCount,
  slowCount,
  total,
  isWarehouse = false,
  onClick,
}: BranchHealthCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Drill into ${branchName}`}
      className="min-h-12 rounded-xl p-4 flex flex-col gap-3 bg-card border shadow-sm hover:shadow-md transition-all cursor-pointer text-left w-full hover:border-primary"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold truncate">{branchName}</span>
          {isWarehouse && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary leading-none">
              WH
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{total} products</span>
      </div>

      {/* Stacked horizontal bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 ? (
          <>
            <div
              className="bg-fast transition-all"
              style={{ flex: fastCount, minWidth: fastCount > 0 ? "4px" : "0" }}
            />
            <div
              className="bg-mid transition-all"
              style={{ flex: midCount, minWidth: midCount > 0 ? "4px" : "0" }}
            />
            <div
              className="bg-slow transition-all"
              style={{ flex: slowCount, minWidth: slowCount > 0 ? "4px" : "0" }}
            />
          </>
        ) : (
          <div className="bg-muted w-full" />
        )}
      </div>

      {/* Count labels */}
      <p className="text-xs text-muted-foreground tabular-nums">
        <span className="text-fast font-medium">{fastCount} Fast</span>
        {" · "}
        <span className="text-mid font-medium">{midCount} Mid</span>
        {" · "}
        <span className="text-slow font-medium">{slowCount} Slow</span>
      </p>
    </button>
  );
}
