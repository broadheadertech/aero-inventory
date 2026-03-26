import { internalMutation } from "../_generated/server";
import { executeMarkdownApproval } from "../helpers/autonomousExecution";

/**
 * Daily autonomous pipeline: evaluates all pending proposals/suggestions
 * against guardrails and auto-executes or flags for Admin review.
 * Runs at 7 AM PHT (23:00 UTC previous day).
 */
export const runAutonomousPipeline = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    let autoExecuted = 0;
    let flagged = 0;

    // Load guardrails
    const guardrails = await ctx.db.query("autonomousGuardrails").collect();
    const getGuardrail = (type: string) => guardrails.find((g) => g.actionType === type);

    // --- MARKDOWN PROPOSALS ---
    const markdownGuardrail = getGuardrail("markdown");
    if (markdownGuardrail?.isEnabled) {
      const pendingMarkdowns = await ctx.db
        .query("markdownProposals")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();

      for (const proposal of pendingMarkdowns) {
        const sourceId = `markdown-${proposal._id}`;

        // Idempotency check
        const existing = await ctx.db
          .query("autonomousActions")
          .withIndex("by_actionType", (q) => q.eq("actionType", "markdown"))
          .filter((q) => q.eq(q.field("sourceId"), sourceId))
          .first();
        if (existing) continue;

        const withinGuardrails = markdownGuardrail.maxMarkdownPercent
          ? proposal.markdownPercent <= markdownGuardrail.maxMarkdownPercent
          : false;

        if (withinGuardrails) {
          // Auto-execute using shared helper (M2 fix)
          const product = await ctx.db.get(proposal.productId);
          await executeMarkdownApproval(ctx, proposal._id, now);

          await ctx.db.insert("autonomousActions", {
            actionType: "markdown",
            status: "auto-executed",
            sourceId,
            details: `Auto-approved ${proposal.markdownPercent}% markdown for ${product?.name ?? "product"}: ₱${(proposal.currentPriceCentavos / 100).toFixed(2)} → ₱${(proposal.proposedPriceCentavos / 100).toFixed(2)}`,
            guardrailCheck: `markdownPercent ${proposal.markdownPercent}% <= max ${markdownGuardrail.maxMarkdownPercent}%`,
            withinGuardrails: true,
            executedAt: now,
          });
          autoExecuted++;
        } else {
          await ctx.db.insert("autonomousActions", {
            actionType: "markdown",
            status: "flagged",
            sourceId,
            details: `Flagged ${proposal.markdownPercent}% markdown proposal for review`,
            guardrailCheck: `markdownPercent ${proposal.markdownPercent}% exceeds max ${markdownGuardrail.maxMarkdownPercent ?? "N/A"}%`,
            withinGuardrails: false,
            executedAt: now,
          });
          flagged++;
        }
      }
    }

    // --- REPLENISHMENT SUGGESTIONS ---
    const replenishGuardrail = getGuardrail("replenishment");
    if (replenishGuardrail?.isEnabled) {
      const pendingSuggestions = await ctx.db
        .query("replenishmentSuggestions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();

      for (const suggestion of pendingSuggestions) {
        const sourceId = `replenishment-${suggestion._id}`;

        const existing = await ctx.db
          .query("autonomousActions")
          .withIndex("by_actionType", (q) => q.eq("actionType", "replenishment"))
          .filter((q) => q.eq(q.field("sourceId"), sourceId))
          .first();
        if (existing) continue;

        const withinGuardrails = replenishGuardrail.maxReplenishmentQty
          ? suggestion.suggestedQty <= replenishGuardrail.maxReplenishmentQty
          : false;

        if (withinGuardrails) {
          await ctx.db.patch(suggestion._id, { status: "confirmed", confirmedAt: now });

          await ctx.db.insert("autonomousActions", {
            actionType: "replenishment",
            status: "auto-executed",
            sourceId,
            details: `Auto-confirmed replenishment of ${suggestion.suggestedQty} units`,
            guardrailCheck: `qty ${suggestion.suggestedQty} <= max ${replenishGuardrail.maxReplenishmentQty}`,
            withinGuardrails: true,
            executedAt: now,
          });
          autoExecuted++;
        } else {
          await ctx.db.insert("autonomousActions", {
            actionType: "replenishment",
            status: "flagged",
            sourceId,
            details: `Flagged replenishment of ${suggestion.suggestedQty} units for review`,
            guardrailCheck: `qty ${suggestion.suggestedQty} exceeds max ${replenishGuardrail.maxReplenishmentQty ?? "N/A"}`,
            withinGuardrails: false,
            executedAt: now,
          });
          flagged++;
        }
      }
    }

    // --- ALLOCATION RECOMMENDATIONS ---
    const allocGuardrail = getGuardrail("allocation");
    const warehouse = await ctx.db
      .query("branches")
      .withIndex("by_type", (q) => q.eq("type", "warehouse"))
      .first();
    if (allocGuardrail?.isEnabled && warehouse) {
      const pendingAllocations = await ctx.db
        .query("allocationRecommendations")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();

      for (const alloc of pendingAllocations) {
        const sourceId = `allocation-${alloc._id}`;

        const existing = await ctx.db
          .query("autonomousActions")
          .withIndex("by_actionType", (q) => q.eq("actionType", "allocation"))
          .filter((q) => q.eq(q.field("sourceId"), sourceId))
          .first();
        if (existing) continue;

        const totalQty = alloc.allocations?.reduce((sum: number, a: { quantity: number }) => sum + a.quantity, 0) ?? 0;

        // Check warehouse has enough stock before auto-executing
        const allocProductId = alloc.productId;
        const allocWarehouseBP = allocProductId
          ? await ctx.db
              .query("branchProducts")
              .withIndex("by_branchId", (q) => q.eq("branchId", warehouse._id))
              .filter((q) => q.eq(q.field("productId"), allocProductId))
              .unique()
          : null;
        const warehouseHasStock = allocWarehouseBP ? allocWarehouseBP.currentSOH >= totalQty : false;

        const withinGuardrails = allocGuardrail.maxAllocationQty
          ? totalQty <= allocGuardrail.maxAllocationQty && warehouseHasStock
          : false;

        if (withinGuardrails) {
          await ctx.db.patch(alloc._id, { status: "confirmed", confirmedAt: now });

          await ctx.db.insert("autonomousActions", {
            actionType: "allocation",
            status: "auto-executed",
            sourceId,
            details: `Auto-confirmed allocation of ${totalQty} units across branches`,
            guardrailCheck: `totalQty ${totalQty} <= max ${allocGuardrail.maxAllocationQty}`,
            withinGuardrails: true,
            executedAt: now,
          });
          autoExecuted++;
        } else {
          await ctx.db.insert("autonomousActions", {
            actionType: "allocation",
            status: "flagged",
            sourceId,
            details: `Flagged allocation of ${totalQty} units for review`,
            guardrailCheck: `totalQty ${totalQty} exceeds max ${allocGuardrail.maxAllocationQty ?? "N/A"}`,
            withinGuardrails: false,
            executedAt: now,
          });
          flagged++;
        }
      }
    }

    return { autoExecuted, flagged };
  },
});
