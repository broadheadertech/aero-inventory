import { BranchDetailClient } from "@/components/branches/branch-detail-client";
import type { Id } from "@/convex/_generated/dataModel";

interface BranchDetailPageProps {
  params: Promise<{ branchId: string }>;
}

export default async function BranchDetailPage({
  params,
}: BranchDetailPageProps) {
  const { branchId } = await params;
  return <BranchDetailClient branchId={branchId as Id<"branches">} />;
}
