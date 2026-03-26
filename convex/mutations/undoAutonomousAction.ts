import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { parseSourceId } from "../helpers/autonomousExecution";

export const undoAutonomousAction = mutation({
  args: { actionId: v.id("autonomousActions") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const action = await ctx.db.get(args.actionId);
    if (!action) throw new ConvexError("Action not found.");
    if (action.status !== "auto-executed") throw new ConvexError("Only auto-executed actions can be undone.");

    // Check 24-hour window
    const executedAt = new Date(action.executedAt);
    const now = new Date();
    const hoursSinceExecution = (now.getTime() - executedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceExecution > 24) {
      throw new ConvexError("Undo window expired. Actions can only be undone within 24 hours.");
    }

    const nowIso = now.toISOString();
    const originalId = parseSourceId(action.sourceId, action.actionType);

    // Reverse the original action atomically (NFR15)
    if (action.actionType === "markdown") {
      const proposal = await ctx.db.get(originalId as Id<"markdownProposals">);
      if (proposal) {
        // Restore original price
        await ctx.db.patch(proposal.productId, { srpCentavos: proposal.currentPriceCentavos });

        const branchProducts = await ctx.db
          .query("branchProducts")
          .withIndex("by_productId", (q) => q.eq("productId", proposal.productId))
          .collect();
        for (const bp of branchProducts) {
          await ctx.db.patch(bp._id, { srpCentavos: proposal.currentPriceCentavos });
        }

        // Revert proposal to pending — replace resolvedAt with undo marker
        await ctx.db.patch(proposal._id, { status: "pending", resolvedAt: `undone-${nowIso}` });
      }
    } else if (action.actionType === "replenishment") {
      const suggestion = await ctx.db.get(originalId as Id<"replenishmentSuggestions">);
      if (suggestion) {
        await ctx.db.patch(suggestion._id, { status: "pending", confirmedAt: `undone-${nowIso}` });
      }
    } else if (action.actionType === "allocation") {
      const alloc = await ctx.db.get(originalId as Id<"allocationRecommendations">);
      if (alloc) {
        await ctx.db.patch(alloc._id, { status: "pending", confirmedAt: `undone-${nowIso}` });
      }
    }

    // Mark action as undone
    await ctx.db.patch(args.actionId, {
      status: "undone",
      undoneAt: nowIso,
      undoneBy: auth.userId,
    });

    await ctx.db.insert("auditLogs", {
      actionType: "undo_autonomous",
      actor: auth.userId,
      targetTable: "autonomousActions",
      targetId: args.actionId,
      details: `Undone auto-executed ${action.actionType} action`,
      timestamp: nowIso,
    });
  },
});
