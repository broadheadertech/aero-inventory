import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

/**
 * Seed demo data for the Aero Inventory Monitoring System.
 * Creates branches, products, branchProducts, and sample sales entries.
 * Idempotent: skips if branches already exist.
 */
export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Check if already seeded
    const existingBranches = await ctx.db.query("branches").take(1);
    if (existingBranches.length > 0) {
      return { seeded: false, message: "Data already exists" };
    }

    const now = new Date().toISOString();

    // ========== BRANCHES ==========
    const branchData = [
      { name: "SM Mall of Asia", code: "MOA", address: "SM Mall of Asia, Pasay City", phone: "02-8888-1001" },
      { name: "SM North EDSA", code: "NE", address: "SM North EDSA, Quezon City", phone: "02-8888-1002" },
      { name: "Greenbelt 5", code: "GB5", address: "Greenbelt 5, Makati City", phone: "02-8888-1003" },
      { name: "SM Megamall", code: "MEGA", address: "SM Megamall, Mandaluyong", phone: "02-8888-1004" },
      { name: "Robinsons Ermita", code: "RE", address: "Robinsons Place Ermita, Manila", phone: "02-8888-1005" },
      { name: "TriNoma", code: "TRI", address: "TriNoma, Quezon City", phone: "02-8888-1006" },
      { name: "SM Cebu", code: "CEB", address: "SM City Cebu, Cebu City", phone: "032-888-1007" },
      { name: "SM Davao", code: "DAV", address: "SM City Davao, Davao City", phone: "082-888-1008" },
    ];

    const branchIds = [];
    for (const b of branchData) {
      const id = await ctx.db.insert("branches", {
        ...b,
        isActive: true,
        type: "branch",
        createdAt: now,
        updatedAt: now,
      });
      branchIds.push(id);
    }

    // Warehouse
    const warehouseId = await ctx.db.insert("branches", {
      name: "Central Warehouse",
      code: "WH",
      address: "Aeropostale PH Distribution Center, Taguig",
      phone: "02-8888-1000",
      isActive: true,
      type: "warehouse",
      createdAt: now,
      updatedAt: now,
    });

    // ========== PRODUCTS ==========
    const products = [
      // Tops
      { styleCode: "AER-TS-001", name: "Classic Logo Tee", department: "Mens", category: "Tops", collection: "Spring 2026", color: "White", unitCost: 35000, retailPrice: 89900 },
      { styleCode: "AER-TS-002", name: "Stripe Crew Neck", department: "Mens", category: "Tops", collection: "Spring 2026", color: "Navy", unitCost: 38000, retailPrice: 99900 },
      { styleCode: "AER-TS-003", name: "Graphic Print Tee", department: "Mens", category: "Tops", collection: "Spring 2026", color: "Black", unitCost: 32000, retailPrice: 79900 },
      { styleCode: "AER-TS-004", name: "V-Neck Essential", department: "Womens", category: "Tops", collection: "Spring 2026", color: "Pink", unitCost: 34000, retailPrice: 84900 },
      { styleCode: "AER-TS-005", name: "Cropped Logo Tee", department: "Womens", category: "Tops", collection: "Spring 2026", color: "Lavender", unitCost: 36000, retailPrice: 89900 },
      // Bottoms
      { styleCode: "AER-BT-001", name: "Slim Fit Jeans", department: "Mens", category: "Bottoms", collection: "Spring 2026", color: "Indigo", unitCost: 65000, retailPrice: 149900 },
      { styleCode: "AER-BT-002", name: "Jogger Pants", department: "Mens", category: "Bottoms", collection: "Spring 2026", color: "Grey", unitCost: 55000, retailPrice: 129900 },
      { styleCode: "AER-BT-003", name: "High-Rise Skinny", department: "Womens", category: "Bottoms", collection: "Spring 2026", color: "Dark Wash", unitCost: 62000, retailPrice: 139900 },
      { styleCode: "AER-BT-004", name: "Wide Leg Denim", department: "Womens", category: "Bottoms", collection: "Spring 2026", color: "Light Wash", unitCost: 68000, retailPrice: 159900 },
      // Outerwear
      { styleCode: "AER-OW-001", name: "Zip-Up Hoodie", department: "Mens", category: "Outerwear", collection: "Fall 2025", color: "Charcoal", unitCost: 72000, retailPrice: 169900 },
      { styleCode: "AER-OW-002", name: "Puffer Jacket", department: "Mens", category: "Outerwear", collection: "Fall 2025", color: "Black", unitCost: 95000, retailPrice: 219900 },
      { styleCode: "AER-OW-003", name: "Cropped Hoodie", department: "Womens", category: "Outerwear", collection: "Fall 2025", color: "Mauve", unitCost: 68000, retailPrice: 159900 },
      // Accessories
      { styleCode: "AER-AC-001", name: "Logo Baseball Cap", department: "Unisex", category: "Accessories", collection: "Spring 2026", color: "White", unitCost: 18000, retailPrice: 49900 },
      { styleCode: "AER-AC-002", name: "Canvas Tote Bag", department: "Unisex", category: "Accessories", collection: "Spring 2026", color: "Natural", unitCost: 25000, retailPrice: 69900 },
      { styleCode: "AER-AC-003", name: "Woven Belt", department: "Mens", category: "Accessories", collection: "Spring 2026", color: "Brown", unitCost: 15000, retailPrice: 39900 },
      // Polos
      { styleCode: "AER-PO-001", name: "Pique Polo", department: "Mens", category: "Polos", collection: "Spring 2026", color: "Red", unitCost: 45000, retailPrice: 109900 },
      { styleCode: "AER-PO-002", name: "Slim Fit Polo", department: "Mens", category: "Polos", collection: "Spring 2026", color: "Royal Blue", unitCost: 48000, retailPrice: 119900 },
      { styleCode: "AER-PO-003", name: "Stretch Polo", department: "Womens", category: "Polos", collection: "Spring 2026", color: "Coral", unitCost: 46000, retailPrice: 114900 },
      // Denim
      { styleCode: "AER-DN-001", name: "Relaxed Fit Jean", department: "Mens", category: "Denim", collection: "Fall 2025", color: "Medium Wash", unitCost: 70000, retailPrice: 159900 },
      { styleCode: "AER-DN-002", name: "Boyfriend Jean", department: "Womens", category: "Denim", collection: "Fall 2025", color: "Vintage Wash", unitCost: 72000, retailPrice: 169900 },
    ];

    const productIds = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      // Warehouse arrival: staggered over the past 8-12 weeks
      const whArrivalOffset = 56 + (i % 5) * 7; // 8-12 weeks ago
      const warehouseArrivalDate = new Date(Date.now() - whArrivalOffset * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const id = await ctx.db.insert("products", {
        styleCode: p.styleCode,
        name: p.name,
        department: p.department,
        category: p.category,
        collection: p.collection,
        color: p.color,
        unitCost: p.unitCost,
        retailPrice: p.retailPrice,
        warehouseArrivalDate,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      productIds.push(id);
    }

    // ========== BRANCH PRODUCTS ==========
    // Assign products to branches with varying stock levels
    const stockProfiles = [
      // MOA (high traffic)
      { mult: 1.5, soldMult: 0.65 },
      // North EDSA
      { mult: 1.3, soldMult: 0.55 },
      // Greenbelt
      { mult: 1.0, soldMult: 0.70 },
      // Megamall
      { mult: 1.4, soldMult: 0.50 },
      // Ermita
      { mult: 0.8, soldMult: 0.35 },
      // TriNoma
      { mult: 1.1, soldMult: 0.60 },
      // Cebu
      { mult: 0.9, soldMult: 0.45 },
      // Davao
      { mult: 0.7, soldMult: 0.30 },
    ];

    // Get current user for enteredBy on sales entries
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    for (let bi = 0; bi < branchIds.length; bi++) {
      const profile = stockProfiles[bi];
      for (let pi = 0; pi < productIds.length; pi++) {
        const baseStock = 30 + (pi % 5) * 10;
        const beginning = Math.round(baseStock * profile.mult);
        const sold = Math.round(beginning * profile.soldMult);
        const soh = beginning - sold;

        // Branch arrival: 3-7 days after warehouse arrival, staggered by branch
        const branchDelayDays = 3 + (bi % 5);
        const whArrivalOffset = 56 + (pi % 5) * 7;
        const branchArrivalOffset = whArrivalOffset - branchDelayDays;
        const deliveryInStoreDate = new Date(Date.now() - branchArrivalOffset * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const bpId = await ctx.db.insert("branchProducts", {
          branchId: branchIds[bi],
          productId: productIds[pi],
          beginningStock: beginning,
          currentSOH: soh,
          deliveryInStoreDate,
          createdAt: now,
          updatedAt: now,
        });

        // Create sales entries so sell-thru can be computed
        if (sold > 0 && currentUser) {
          // Spread sales across last 4 weeks
          for (let week = 0; week < 4; week++) {
            const weekSold = Math.round(sold / 4);
            if (weekSold <= 0) continue;
            const saleDate = new Date(Date.now() - (week * 7 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000);
            await ctx.db.insert("salesEntries", {
              branchId: branchIds[bi],
              productId: productIds[pi],
              branchProductId: bpId,
              quantitySold: weekSold,
              salePrice: products[pi].retailPrice,
              enteredBy: currentUser._id,
              enteredAt: saleDate.toISOString(),
            });
          }
        }
      }
    }

    // ========== WAREHOUSE STOCK ==========
    // Warehouse holds remaining unallocated stock for each product
    for (let pi = 0; pi < productIds.length; pi++) {
      // Total units received from supplier (sum across branches + warehouse reserve)
      const totalReceived = branchIds.reduce((sum, _, bi) => {
        const baseStock = 30 + (pi % 5) * 10;
        return sum + Math.round(baseStock * stockProfiles[bi].mult);
      }, 0);
      // Warehouse keeps ~30-50% of total as reserve
      const warehouseReserve = Math.round(totalReceived * (0.3 + (pi % 3) * 0.1));

      await ctx.db.insert("branchProducts", {
        branchId: warehouseId,
        productId: productIds[pi],
        beginningStock: warehouseReserve,
        currentSOH: warehouseReserve,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ========== SETTINGS (Thresholds) ==========
    await ctx.db.insert("settings", {
      settingKey: "sellThruThresholds",
      timePeriod: "weekly",
      fastThreshold: 60,
      slowThreshold: 30,
      createdBy: currentUser?._id,
      createdAt: now,
      updatedAt: now,
    });

    // ========== SUPPLIERS ==========
    const supplierData = [
      { name: "Pacific Threads Co.", contactName: "Maria Santos", contactEmail: "maria@pacificthreads.ph", leadTimeDays: 14 },
      { name: "Manila Garments Inc.", contactName: "Jose Reyes", contactEmail: "jose@manilagarments.ph", leadTimeDays: 10 },
      { name: "Visayas Textiles", contactName: "Ana Cruz", contactEmail: "ana@visayastextiles.ph", leadTimeDays: 21 },
    ];

    for (const s of supplierData) {
      await ctx.db.insert("suppliers", {
        ...s,
        productsSupplied: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      seeded: true,
      branches: branchIds.length + 1,
      products: productIds.length,
      branchProducts: branchIds.length * productIds.length,
      suppliers: supplierData.length,
    };
  },
});
