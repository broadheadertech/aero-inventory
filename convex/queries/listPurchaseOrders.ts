import { query } from "../_generated/server";
import { v } from "convex/values";
import { _requireAuth, _assertAdmin } from "../helpers/auth";

export const listPurchaseOrders = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth = await _requireAuth(ctx);
    _assertAdmin(auth);

    let orders;
    if (args.status) {
      orders = await ctx.db
        .query("purchaseOrders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    } else {
      orders = await ctx.db
        .query("purchaseOrders")
        .withIndex("by_createdAt")
        .order("desc")
        .take(100);
    }

    const suppliers = await ctx.db.query("suppliers").collect();
    const products = await ctx.db.query("products").collect();

    const supplierMap = new Map(suppliers.map((s) => [s._id, s.name]));
    const productMap = new Map(products.map((p) => [p._id, { name: p.name, sku: p.styleCode, imageUrl: p.imageUrl ?? null }]));

    return orders.map((po) => ({
      ...po,
      supplierName: supplierMap.get(po.supplierId) ?? "Unknown",
      itemsSummary: po.items.map((item) => {
        const product = productMap.get(item.productId);
        return {
          ...item,
          productName: product?.name ?? "Unknown",
          productSku: product?.sku ?? "",
          productImageUrl: product?.imageUrl ?? null,
        };
      }),
    }));
  },
});
