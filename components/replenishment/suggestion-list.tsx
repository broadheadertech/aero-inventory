"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestionCard } from "@/components/replenishment/suggestion-card";

type SuggestionListProps = {
  branchId?: Id<"branches">;
};

export function SuggestionList({ branchId }: SuggestionListProps) {
  const suggestions = useQuery(
    api.queries.listReplenishmentSuggestions.listReplenishmentSuggestions,
    { branchId }
  );

  if (suggestions === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border py-12">
        <p className="text-sm text-muted-foreground">
          No pending restock suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <SuggestionCard
          key={s._id}
          suggestionId={s._id}
          styleCode={s.styleCode}
          productName={s.productName}
          branchName={s.branchName}
          currentSOH={s.currentSOH}
          currentADS={s.currentADS}
          suggestedQuantity={s.suggestedQuantity}
        />
      ))}
    </div>
  );
}
