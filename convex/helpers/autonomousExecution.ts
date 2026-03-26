import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Execute a markdown approval: update product SRP and all branchProducts atomically.
 */
export async function executeMarkdownApproval(
  ctx: MutationCtx,
  proposalId: Id<"markdownProposals">,
  now: string
): Promise<boolean> {
  const proposal = await ctx.db.get(proposalId);
  if (!proposal || proposal.status !== "pending") return false;

  await ctx.db.patch(proposal.productId, { srpCentavos: proposal.proposedPriceCentavos });

  const branchProducts = await ctx.db
    .query("branchProducts")
    .withIndex("by_productId", (q) => q.eq("productId", proposal.productId))
    .collect();

  for (const bp of branchProducts) {
    await ctx.db.patch(bp._id, { srpCentavos: proposal.proposedPriceCentavos });
  }

  await ctx.db.patch(proposalId, { status: "approved", resolvedAt: now });
  return true;
}

/**
 * Parse a sourceId back to the original document ID.
 * Format: "{actionType}-{documentId}"
 */
export function parseSourceId(sourceId: string, actionType: string): string {
  return sourceId.replace(`${actionType}-`, "");
}
