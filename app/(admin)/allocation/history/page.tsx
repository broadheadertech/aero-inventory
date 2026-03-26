"use client";

import { AllocationHistoryTable } from "@/components/allocation/allocation-history-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AllocationHistoryPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Allocation History</h1>
          <p className="text-muted-foreground">
            Past allocation decisions and their outcomes
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/allocation")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Allocation
        </Button>
      </div>
      <AllocationHistoryTable />
    </div>
  );
}
