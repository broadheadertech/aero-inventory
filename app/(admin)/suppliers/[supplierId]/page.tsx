"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { SupplierScorecard } from "@/components/suppliers/supplier-scorecard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SupplierDetailPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = use(params);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/suppliers")}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back to Suppliers
      </Button>
      <SupplierScorecard supplierId={supplierId as Id<"suppliers">} />
    </div>
  );
}
