import { internalMutation } from "../_generated/server";

/**
 * Daily reorder point evaluation.
 * Checks all enabled reorder rules against current SOH and forecast demand.
 * Auto-generates POs when projected SOH falls below safety stock.
 * Runs at 6 AM PHT (22:00 UTC).
 */
export const evaluateReorderPoints = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    let posCreated = 0;
    let skipped = 0;
    const newPOIds: string[] = []; // M2 fix: track only POs created in this run

    const rules = await ctx.db.query("reorderRules").collect();
    const enabledRules = rules.filter((r) => r.isEnabled);

    if (enabledRules.length === 0) return { posCreated: 0, skipped: 0 };

    for (const rule of enabledRules) {
      const product = await ctx.db.get(rule.productId);
      const supplier = await ctx.db.get(rule.supplierId);
      if (!product || !supplier) continue;

      // Idempotency: skip if active PO already exists for this product+supplier
      const existingPO = await ctx.db
        .query("purchaseOrders")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", rule.supplierId))
        .filter((q) =>
          q.and(
            q.neq(q.field("status"), "closed"),
            q.neq(q.field("status"), "cancelled"),
            q.neq(q.field("status"), "received")
          )
        )
        .collect();

      const hasActivePOForProduct = existingPO.some((po) =>
        po.items.some((item) => item.productId === rule.productId)
      );

      if (hasActivePOForProduct) {
        skipped++;
        continue;
      }

      // Get current SOH across all branches
      const branchProducts = await ctx.db
        .query("branchProducts")
        .withIndex("by_productId", (q) => q.eq("productId", rule.productId))
        .collect();

      const currentSOH = branchProducts.reduce((sum, bp) => sum + bp.currentSOH, 0);

      // M1 fix: get latest forecast directly using order + first
      const latestForecast = await ctx.db
        .query("demandForecasts")
        .withIndex("by_productId", (q) => q.eq("productId", rule.productId))
        .order("desc")
        .first();

      const weeklyDemandPercent = latestForecast?.weekForecasts[0]?.predictedSellThruPercent ?? 5;

      const totalBeginning = branchProducts.reduce(
        (sum, bp) => sum + (bp.beginningStock ?? 0), 0
      );
      const avgDailyDemand = totalBeginning > 0
        ? (totalBeginning * (weeklyDemandPercent / 100)) / 7
        : 1;

      // Safety stock = avg daily demand x (lead time + buffer)
      const safetyStock = Math.ceil(avgDailyDemand * (supplier.leadTimeDays + rule.safetyBufferDays));

      if (currentSOH >= safetyStock) {
        skipped++;
        continue;
      }

      // Calculate order quantity: bring SOH up to 2x safety stock, minimum minOrderQuantity
      const deficit = safetyStock * 2 - currentSOH;
      const orderQty = Math.max(rule.minOrderQuantity, Math.ceil(deficit));

      // Create PO
      const unitCost = product.unitCost ?? 0;
      const poId = await ctx.db.insert("purchaseOrders", {
        supplierId: rule.supplierId,
        status: "draft",
        items: [{
          productId: rule.productId,
          quantity: orderQty,
          unitCostCentavos: unitCost,
        }],
        totalCostCentavos: orderQty * unitCost,
        triggeredBy: "auto",
        reorderReason: `SOH ${currentSOH} below safety stock ${safetyStock} (demand ${avgDailyDemand.toFixed(1)}/day, lead ${supplier.leadTimeDays}d + buffer ${rule.safetyBufferDays}d)`,
        createdAt: now,
      });

      newPOIds.push(poId);
      posCreated++;
    }

    // M2 fix: auto-send only POs created in this run, not all drafts
    for (const poId of newPOIds) {
      await ctx.db.patch(poId, { status: "sent", sentAt: now });
    }

    return { posCreated, skipped, sent: draftPOs.length };
  },
});
