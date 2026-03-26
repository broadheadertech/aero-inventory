import { query } from "../_generated/server";
import { _requireAuth } from "../helpers/auth";
import type { Id } from "../_generated/dataModel";

/**
 * listTransfers — returns transfer requests relevant to the calling user.
 *
 * Branch Manager: sees transfers where their branch is source OR destination.
 * Admin: sees ALL transfers across the network.
 *
 * Results include resolved branch names, transfer items with product info,
 * and `myBranchId` (the caller's branch) so the UI can determine direction
 * without a separate query.
 *
 * Sorted by createdAt descending (newest first).
 */
export const listTransfers = query({
  args: {},
  handler: async (ctx) => {
    const auth = await _requireAuth(ctx);

    let transfers;
    let myBranchId: Id<"branches"> | null = null;

    if (auth.role === "Admin") {
      transfers = await ctx.db.query("transfers").collect();
    } else {
      // Branch Manager or Staff: show transfers for their primary branch
      const branchId = auth.branchIds[0];
      if (!branchId) return { transfers: [], myBranchId: null };
      myBranchId = branchId;

      const outgoing = await ctx.db
        .query("transfers")
        .withIndex("by_sourceBranchId", (q) => q.eq("sourceBranchId", branchId))
        .collect();

      const incomingAll = await ctx.db
        .query("transfers")
        .withIndex("by_destinationBranchId", (q) => q.eq("destinationBranchId", branchId))
        .collect();

      // Merge and deduplicate (outgoing and incoming are disjoint by design)
      transfers = [...outgoing, ...incomingAll];
    }

    // Sort newest first
    transfers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Enrich with branch names and items
    const enriched = await Promise.all(
      transfers.map(async (transfer) => {
        const [sourceBranch, destBranch] = await Promise.all([
          ctx.db.get(transfer.sourceBranchId),
          ctx.db.get(transfer.destinationBranchId),
        ]);

        const rawItems = await ctx.db
          .query("transferItems")
          .withIndex("by_transferId", (q) => q.eq("transferId", transfer._id))
          .collect();

        const items = await Promise.all(
          rawItems.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return {
              productId: item.productId,
              styleCode: product?.styleCode ?? "Unknown",
              productName: product?.name ?? "Unknown product",
              productImageUrl: product?.imageUrl ?? null,
              quantity: item.quantity,
            };
          })
        );

        return {
          ...transfer,
          sourceBranchName: sourceBranch?.name ?? "Unknown",
          destinationBranchName: destBranch?.name ?? "Unknown",
          items,
        };
      })
    );

    return { transfers: enriched, myBranchId };
  },
});
