import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { _requireAuth } from "../helpers/auth";
import type { Doc, Id } from "../_generated/dataModel";

export const createTransferRequest = mutation({
  args: {
    destinationBranchId: v.id("branches"),
    items: v.array(
      v.object({
        branchProductId: v.id("branchProducts"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);

    // Only Branch Managers (and Admin for testing) may create transfer requests
    if (auth.role === "Branch Staff") {
      throw new ConvexError("Forbidden: Branch Staff cannot create transfer requests");
    }

    if (args.items.length === 0) {
      throw new ConvexError("At least one product item is required");
    }

    // Validate destination branch exists and is active
    const destBranch = await ctx.db.get(args.destinationBranchId);
    if (!destBranch || !destBranch.isActive) {
      throw new ConvexError("Invalid destination branch");
    }

    const sourceBranchId = auth.branchIds[0];
    if (!sourceBranchId) {
      throw new ConvexError("You have no branch assigned");
    }

    if (sourceBranchId === args.destinationBranchId) {
      throw new ConvexError("Destination branch must differ from your branch");
    }

    // Validate each item and cache fetched records to avoid double-fetching during insertion
    const bpCache = new Map<string, Doc<"branchProducts">>();
    for (const item of args.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new ConvexError("Quantity must be a positive integer");
      }

      const bp = await ctx.db.get(item.branchProductId);
      if (!bp) {
        throw new ConvexError("Product assignment not found");
      }
      if (bp.branchId !== sourceBranchId) {
        throw new ConvexError("Product does not belong to your branch");
      }
      if (item.quantity > bp.currentSOH) {
        throw new ConvexError(
          `Quantity exceeds available stock (${bp.currentSOH} available)`
        );
      }
      bpCache.set(item.branchProductId as string, bp);
    }

    const now = new Date().toISOString();

    // Insert the transfer record
    const transferId = await ctx.db.insert("transfers", {
      sourceBranchId,
      destinationBranchId: args.destinationBranchId,
      requestedByUserId: auth.userId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Insert transfer items — reuse cached branchProduct records (no double fetch)
    for (const item of args.items) {
      const bp = bpCache.get(item.branchProductId as string);
      if (!bp) continue; // validated above; guard for type safety
      await ctx.db.insert("transferItems", {
        transferId,
        productId: bp.productId,
        quantity: item.quantity,
      });
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      actionType: "transfer_request_created",
      actor: auth.userId,
      targetTable: "transfers",
      targetId: transferId,
      details: `Transfer requested: ${sourceBranchId} → ${args.destinationBranchId}, ${args.items.length} item(s)`,
      timestamp: now,
    });

    return transferId;
  },
});
