import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const approveProposal = mutation({
  args: { proposalId: v.id("markdownProposals") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new ConvexError("Proposal not found.");
    if (proposal.status !== "pending") throw new ConvexError("Proposal already resolved.");

    const now = new Date().toISOString();

    // Atomic price update: update product SRP
    const product = await ctx.db.get(proposal.productId);
    if (!product) throw new ConvexError("Product not found.");

    await ctx.db.patch(proposal.productId, {
      srpCentavos: proposal.proposedPriceCentavos,
    });

    // Update all branchProducts for this product
    const branchProducts = await ctx.db
      .query("branchProducts")
      .withIndex("by_productId", (q) => q.eq("productId", proposal.productId))
      .collect();

    for (const bp of branchProducts) {
      await ctx.db.patch(bp._id, {
        srpCentavos: proposal.proposedPriceCentavos,
      });
    }

    await ctx.db.patch(args.proposalId, {
      status: "approved",
      resolvedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "approve_markdown",
      actor: auth.userId,
      targetTable: "markdownProposals",
      targetId: args.proposalId,
      details: `Approved markdown for ${product.name}: ₱${(proposal.currentPriceCentavos / 100).toFixed(2)} → ₱${(proposal.proposedPriceCentavos / 100).toFixed(2)}`,
      timestamp: now,
    });
  },
});

export const rejectProposal = mutation({
  args: {
    proposalId: v.id("markdownProposals"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new ConvexError("Proposal not found.");
    if (proposal.status !== "pending") throw new ConvexError("Proposal already resolved.");

    await ctx.db.patch(args.proposalId, {
      status: "rejected",
      rejectionReason: args.reason,
      resolvedAt: new Date().toISOString(),
    });
  },
});
