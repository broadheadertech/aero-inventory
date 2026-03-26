"use client";

import { AllocationWizard } from "@/components/allocation/allocation-wizard";

export default function AllocationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Smart Allocation</h1>
        <p className="text-muted-foreground">
          Distribute warehouse stock using data-driven recommendations
        </p>
      </div>
      <AllocationWizard />
    </div>
  );
}
