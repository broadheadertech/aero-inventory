import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import { executeMarkdownApproval, parseSourceId } from "../helpers/autonomousExecution";

export const approveAutonomousAction = mutation({
  args: { actionId: v.id("autonomousActions") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const action = await ctx.db.get(args.actionId);
    if (!action) throw new ConvexError("Action not found.");
    if (action.status !== "flagged") throw new ConvexError("Only flagged actions can be approved.");

    const now = new Date().toISOString();
    const originalId = parseSourceId(action.sourceId, action.actionType);

    // Execute the original action using shared helpers (M1+M2 fix)
    if (action.actionType === "markdown") {
      await executeMarkdownApproval(ctx, originalId as Id<"markdownProposals">, now);
    } else if (action.actionType === "replenishment") {
      const suggestion = await ctx.db.get(originalId as Id<"replenishmentSuggestions">);
      if (suggestion && suggestion.status === "pending") {
        await ctx.db.patch(suggestion._id, { status: "confirmed", confirmedAt: now });
      }
    } else if (action.actionType === "allocation") {
      const alloc = await ctx.db.get(originalId as Id<"allocationRecommendations">);
      if (alloc && alloc.status === "pending") {
        await ctx.db.patch(alloc._id, { status: "confirmed", confirmedAt: now });
      }
    }

    await ctx.db.patch(args.actionId, { status: "approved", executedAt: now });

    await ctx.db.insert("auditLogs", {
      actionType: "approve_autonomous",
      actor: auth.userId,
      targetTable: "autonomousActions",
      targetId: args.actionId,
      details: `Approved flagged ${action.actionType} action`,
      timestamp: now,
    });
  },
});

export const rejectAutonomousAction = mutation({
  args: { actionId: v.id("autonomousActions") },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const action = await ctx.db.get(args.actionId);
    if (!action) throw new ConvexError("Action not found.");
    if (action.status !== "flagged") throw new ConvexError("Only flagged actions can be rejected.");

    const now = new Date().toISOString();
    const originalId = parseSourceId(action.sourceId, action.actionType);

    // L1 fix: also reject/dismiss the original pending proposal
    if (action.actionType === "markdown") {
      const proposal = await ctx.db.get(originalId as Id<"markdownProposals">);
      if (proposal && proposal.status === "pending") {
        await ctx.db.patch(proposal._id, { status: "rejected", rejectionReason: "Rejected via autonomous exception queue", resolvedAt: now });
      }
    } else if (action.actionType === "replenishment") {
      const suggestion = await ctx.db.get(originalId as Id<"replenishmentSuggestions">);
      if (suggestion && suggestion.status === "pending") {
        await ctx.db.patch(suggestion._id, { status: "dismissed", confirmedAt: now });
      }
    } else if (action.actionType === "allocation") {
      const alloc = await ctx.db.get(originalId as Id<"allocationRecommendations">);
      if (alloc && alloc.status === "pending") {
        await ctx.db.patch(alloc._id, { status: "dismissed", confirmedAt: now });
      }
    }

    await ctx.db.patch(args.actionId, { status: "rejected" });
  },
});
