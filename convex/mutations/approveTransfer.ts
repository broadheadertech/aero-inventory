import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";
import type { Doc } from "../_generated/dataModel";

export const approveTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) throw new ConvexError("Transfer not found");
    if (transfer.status !== "pending") {
      throw new ConvexError("Transfer is no longer pending");
    }

    const rawItems = await ctx.db
      .query("transferItems")
      .withIndex("by_transferId", (q) => q.eq("transferId", args.transferId))
      .collect();

    if (rawItems.length === 0) {
      throw new ConvexError("Transfer has no items");
    }

    // --- VALIDATION PHASE: check all items before any writes ---
    type ItemContext = {
      item: Doc<"transferItems">;
      sourceBP: Doc<"branchProducts">;
      destBP: Doc<"branchProducts"> | null;
    };
    const contexts: ItemContext[] = [];

    for (const item of rawItems) {
      const sourceBP = await ctx.db
        .query("branchProducts")
        .withIndex("by_branchId_productId", (q) =>
          q.eq("branchId", transfer.sourceBranchId)
        )
        .filter((q) => q.eq(q.field("productId"), item.productId))
        .unique();

      if (!sourceBP) {
        throw new ConvexError("Source inventory record not found");
      }
      if (sourceBP.currentSOH < item.quantity) {
        throw new ConvexError(
          `Insufficient stock. Current SOH: ${sourceBP.currentSOH}`
        );
      }

      const destBP =
        (await ctx.db
          .query("branchProducts")
          .withIndex("by_branchId_productId", (q) =>
            q.eq("branchId", transfer.destinationBranchId)
          )
          .filter((q) => q.eq(q.field("productId"), item.productId))
          .unique()) ?? null;

      contexts.push({ item, sourceBP, destBP });
    }

    // --- WRITE PHASE: only reached if all validations passed ---
    const now = new Date().toISOString();

    for (const { item, sourceBP, destBP } of contexts) {
      await ctx.db.patch(sourceBP._id, {
        currentSOH: sourceBP.currentSOH - item.quantity,
        updatedAt: now,
      });

      if (destBP) {
        await ctx.db.patch(destBP._id, {
          currentSOH: destBP.currentSOH + item.quantity,
          updatedAt: now,
        });
      } else {
        // Destination branch doesn't have this product yet — create the record
        await ctx.db.insert("branchProducts", {
          branchId: transfer.destinationBranchId,
          productId: item.productId,
          beginningStock: 0,
          currentSOH: item.quantity,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.transferId, {
      status: "approved",
      approvedByUserId: auth.userId,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      actionType: "transfer_approved",
      actor: auth.userId,
      targetTable: "transfers",
      targetId: args.transferId as string,
      details: `Transfer approved: ${transfer.sourceBranchId} → ${transfer.destinationBranchId}, ${rawItems.length} item(s)`,
      timestamp: now,
    });

    return args.transferId;
  },
});
