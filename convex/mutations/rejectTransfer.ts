import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const rejectTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    adminComment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) throw new ConvexError("Transfer not found");
    if (transfer.status !== "pending") {
      throw new ConvexError("Transfer is no longer pending");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.transferId, {
      status: "rejected",
      adminComment: args.adminComment,
      updatedAt: now,
    });

    // Audit log
    const commentSuffix = args.adminComment
      ? ` Reason: ${args.adminComment}`
      : "";
    await ctx.db.insert("auditLogs", {
      actionType: "transfer_rejected",
      actor: auth.userId,
      targetTable: "transfers",
      targetId: args.transferId as string,
      details: `Transfer rejected: ${transfer.sourceBranchId} → ${transfer.destinationBranchId}.${commentSuffix}`,
      timestamp: now,
    });
  },
});
