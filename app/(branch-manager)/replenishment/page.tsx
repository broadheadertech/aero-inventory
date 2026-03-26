"use client";

import { SuggestionList } from "@/components/replenishment/suggestion-list";

export default function BranchManagerReplenishmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Replenishment</h1>
        <p className="text-muted-foreground">
          Restock suggestions based on your branch&apos;s stock levels
        </p>
      </div>
      <SuggestionList />
    </div>
  );
}
