import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("Branch Manager"),
      v.literal("Branch Staff")
    ),
    branchIds: v.array(v.id("branches")),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  branches: defineTable({
    name: v.string(),
    code: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    type: v.optional(v.union(v.literal("branch"), v.literal("warehouse"))),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"])
    .index("by_type", ["type"]),

  products: defineTable({
    styleCode: v.string(),
    name: v.string(),
    department: v.string(),
    class: v.optional(v.string()),
    category: v.string(),
    subcategory: v.optional(v.string()),
    collection: v.string(),
    fabric: v.optional(v.string()),
    color: v.string(),
    printApplication: v.optional(v.string()),
    unitCost: v.number(),
    retailPrice: v.number(),
    imageUrl: v.optional(v.string()),
    warehouseArrivalDate: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_styleCode", ["styleCode"])
    .index("by_department", ["department"])
    .index("by_category", ["category"])
    .index("by_collection", ["collection"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_styleCode", { searchField: "styleCode" }),

  branchProducts: defineTable({
    branchId: v.id("branches"),
    productId: v.id("products"),
    beginningStock: v.number(),
    currentSOH: v.number(),
    deliveryInStoreDate: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_branchId_productId", ["branchId", "productId"])
    .index("by_branchId", ["branchId"])
    .index("by_productId", ["productId"]),

  salesEntries: defineTable({
    branchId: v.id("branches"),
    productId: v.id("products"),
    branchProductId: v.id("branchProducts"),
    quantitySold: v.number(),
    salePrice: v.number(),
    enteredBy: v.id("users"),
    enteredAt: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_branchId_enteredAt", ["branchId", "enteredAt"])
    .index("by_productId", ["productId"])
    .index("by_enteredBy", ["enteredBy"])
    .index("by_enteredAt", ["enteredAt"]),

  settings: defineTable({
    settingKey: v.string(),
    timePeriod: v.string(),
    fastThreshold: v.number(),
    slowThreshold: v.number(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_settingKey", ["settingKey"])
    .index("by_timePeriod", ["timePeriod"]),

  replenishmentRules: defineTable({
    name: v.string(),
    scope: v.union(v.literal("all"), v.literal("category"), v.literal("specific")),
    scopeFilter: v.optional(
      v.object({
        department: v.optional(v.string()),
        category: v.optional(v.string()),
        productIds: v.optional(v.array(v.id("products"))),
      })
    ),
    thresholdDays: v.number(),
    coverageDays: v.number(),
    isEnabled: v.boolean(),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_isEnabled", ["isEnabled"])
    .index("by_scope", ["scope"]),

  replenishmentSuggestions: defineTable({
    ruleId: v.id("replenishmentRules"),
    branchId: v.id("branches"),
    productId: v.id("products"),
    currentSOH: v.number(),
    currentADS: v.number(),
    suggestedQuantity: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("dismissed")
    ),
    confirmedTransferId: v.optional(v.id("transfers")),
    createdAt: v.string(),
  })
    .index("by_branchId_status", ["branchId", "status"])
    .index("by_ruleId", ["ruleId"])
    .index("by_status", ["status"]),

  allocationHistory: defineTable({
    productId: v.id("products"),
    totalQuantity: v.number(),
    allocations: v.array(
      v.object({
        branchId: v.id("branches"),
        recommendedQty: v.number(),
        adjustedQty: v.number(),
        sellThruRate: v.number(),
      })
    ),
    algorithmVersion: v.string(),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_productId", ["productId"])
    .index("by_createdAt", ["createdAt"]),

  suppliers: defineTable({
    name: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    phone: v.optional(v.string()),
    leadTimeDays: v.number(),
    productsSupplied: v.array(v.id("products")),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_name", ["name"])
    .index("by_isActive", ["isActive"]),

  supplierDeliveries: defineTable({
    supplierId: v.id("suppliers"),
    promisedDate: v.string(),
    actualDate: v.string(),
    quantityOrdered: v.number(),
    quantityReceived: v.number(),
    qualityNotes: v.optional(v.string()),
    qualityRejected: v.number(),
    status: v.string(),
    leadTimeVarianceDays: v.number(),
    createdAt: v.string(),
  })
    .index("by_supplierId", ["supplierId"])
    .index("by_actualDate", ["actualDate"]),

  markdownRules: defineTable({
    name: v.string(),
    classification: v.string(),
    minWeeksOnFloor: v.number(),
    markdownPercent: v.number(),
    isEnabled: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_isEnabled", ["isEnabled"]),

  markdownProposals: defineTable({
    ruleId: v.id("markdownRules"),
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    currentPriceCentavos: v.number(),
    proposedPriceCentavos: v.number(),
    markdownPercent: v.number(),
    currentMarginPercent: v.number(),
    postMarkdownMarginPercent: v.number(),
    status: v.string(),
    rejectionReason: v.optional(v.string()),
    createdAt: v.string(),
    resolvedAt: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_productId", ["productId"])
    .index("by_ruleId", ["ruleId"]),

  demandForecasts: defineTable({
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    forecastDate: v.string(),
    weekForecasts: v.array(v.object({
      weekNumber: v.number(),
      predictedSellThruPercent: v.number(),
    })),
    confidence: v.string(),
    dataPointsUsed: v.number(),
    weatherAdjusted: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_productId", ["productId"])
    .index("by_branchId", ["branchId"])
    .index("by_forecastDate", ["forecastDate"]),

  weatherLocations: defineTable({
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    branchIds: v.array(v.id("branches")),
    isActive: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_isActive", ["isActive"]),

  weatherCache: defineTable({
    locationId: v.id("weatherLocations"),
    date: v.string(),
    temperatureCelsius: v.number(),
    humidity: v.number(),
    rainfallMm: v.number(),
    weatherCondition: v.string(),
    fetchedAt: v.string(),
  })
    .index("by_locationId", ["locationId"])
    .index("by_date", ["date"])
    .index("by_locationId_date", ["locationId", "date"]),

  posConfig: defineTable({
    branchId: v.id("branches"),
    isEnabled: v.boolean(),
    webhookSecret: v.string(),
    lastSyncAt: v.optional(v.string()),
    syncSuccessCount: v.number(),
    syncErrorCount: v.number(),
  })
    .index("by_branchId", ["branchId"]),

  posTransactions: defineTable({
    transactionId: v.string(),
    branchId: v.id("branches"),
    productId: v.optional(v.id("products")),
    sku: v.string(),
    quantity: v.number(),
    priceCentavos: v.number(),
    posTimestamp: v.string(),
    syncStatus: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_transactionId", ["transactionId"])
    .index("by_branchId", ["branchId"])
    .index("by_syncStatus", ["syncStatus"])
    .index("by_createdAt", ["createdAt"]),

  autonomousGuardrails: defineTable({
    actionType: v.string(),
    isEnabled: v.boolean(),
    maxMarkdownPercent: v.optional(v.number()),
    maxAllocationQty: v.optional(v.number()),
    maxReplenishmentQty: v.optional(v.number()),
    forecastVarianceTolerance: v.optional(v.number()),
    updatedAt: v.string(),
  })
    .index("by_actionType", ["actionType"]),

  autonomousActions: defineTable({
    actionType: v.string(),
    status: v.string(),
    sourceId: v.string(),
    details: v.string(),
    guardrailCheck: v.string(),
    withinGuardrails: v.boolean(),
    executedAt: v.string(),
    undoneAt: v.optional(v.string()),
    undoneBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_actionType", ["actionType"])
    .index("by_executedAt", ["executedAt"]),

  customerFeedback: defineTable({
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    rating: v.number(),
    comment: v.string(),
    contactInfo: v.optional(v.string()),
    sentiment: v.string(),
    themes: v.array(v.string()),
    source: v.string(),
    createdAt: v.string(),
  })
    .index("by_productId", ["productId"])
    .index("by_branchId", ["branchId"])
    .index("by_sentiment", ["sentiment"])
    .index("by_createdAt", ["createdAt"]),

  feedbackThemeConfig: defineTable({
    theme: v.string(),
    keywords: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_theme", ["theme"]),

  mlModels: defineTable({
    modelVersion: v.string(),
    status: v.string(),
    trainingDataRange: v.string(),
    accuracy: v.optional(v.number()),
    featureSet: v.array(v.string()),
    modelUrl: v.optional(v.string()),
    trainedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_trainedAt", ["trainedAt"]),

  mlForecasts: defineTable({
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    modelVersion: v.string(),
    forecastDate: v.string(),
    weekForecasts: v.array(v.object({
      weekNumber: v.number(),
      predictedSellThruPercent: v.number(),
    })),
    confidence: v.number(),
    createdAt: v.string(),
  })
    .index("by_productId", ["productId"])
    .index("by_forecastDate", ["forecastDate"]),

  reorderRules: defineTable({
    productId: v.id("products"),
    supplierId: v.id("suppliers"),
    safetyBufferDays: v.number(),
    minOrderQuantity: v.number(),
    isEnabled: v.boolean(),
    updatedAt: v.string(),
  })
    .index("by_productId", ["productId"])
    .index("by_supplierId", ["supplierId"]),

  purchaseOrders: defineTable({
    supplierId: v.id("suppliers"),
    status: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitCostCentavos: v.number(),
    })),
    totalCostCentavos: v.number(),
    triggeredBy: v.string(),
    reorderReason: v.string(),
    sentAt: v.optional(v.string()),
    acknowledgedAt: v.optional(v.string()),
    expectedDeliveryDate: v.optional(v.string()),
    receivedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_supplierId", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  loyaltyMembers: defineTable({
    externalMemberId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    tier: v.string(),
    preferredCategories: v.array(v.string()),
    purchaseCount: v.number(),
    lastVisitDate: v.optional(v.string()),
    syncedAt: v.string(),
  })
    .index("by_externalMemberId", ["externalMemberId"])
    .index("by_tier", ["tier"]),

  loyaltyTransactions: defineTable({
    memberId: v.id("loyaltyMembers"),
    salesEntryId: v.optional(v.id("salesEntries")),
    posTransactionId: v.optional(v.id("posTransactions")),
    branchId: v.id("branches"),
    amountCentavos: v.number(),
    pointsEarned: v.number(),
    createdAt: v.string(),
  })
    .index("by_memberId", ["memberId"])
    .index("by_branchId", ["branchId"]),

  loyaltyConfig: defineTable({
    apiEndpoint: v.string(),
    apiKey: v.string(),
    syncFrequencyHours: v.number(),
    isEnabled: v.boolean(),
    lastSyncAt: v.optional(v.string()),
    updatedAt: v.string(),
  }),

  regions: defineTable({
    name: v.string(),
    countryCode: v.string(),
    currencyCode: v.string(),
    timezone: v.string(),
    locale: v.string(),
    isActive: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_countryCode", ["countryCode"])
    .index("by_isActive", ["isActive"]),

  exchangeRates: defineTable({
    fromCurrency: v.string(),
    toCurrency: v.string(),
    rate: v.number(),
    fetchedAt: v.string(),
  })
    .index("by_fromCurrency", ["fromCurrency"])
    .index("by_fetchedAt", ["fetchedAt"]),

  auditLogs: defineTable({
    actionType: v.string(),
    actor: v.id("users"),
    targetTable: v.string(),
    targetId: v.optional(v.string()),
    changes: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.string(),
  })
    .index("by_actor", ["actor"])
    .index("by_targetTable", ["targetTable"])
    .index("by_timestamp", ["timestamp"]),

  transfers: defineTable({
    sourceBranchId: v.id("branches"),
    destinationBranchId: v.id("branches"),
    requestedByUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    adminComment: v.optional(v.string()),
    approvedByUserId: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_sourceBranchId", ["sourceBranchId"])
    .index("by_destinationBranchId", ["destinationBranchId"])
    .index("by_requestedByUserId", ["requestedByUserId"]),

  transferItems: defineTable({
    transferId: v.id("transfers"),
    productId: v.id("products"),
    quantity: v.number(),
  }).index("by_transferId", ["transferId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("slow_mover"),
      v.literal("network_slow_mover"),
      v.literal("autonomous_digest")
    ),
    title: v.string(),
    message: v.string(),
    productId: v.optional(v.id("products")),
    branchId: v.optional(v.id("branches")),
    isRead: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_productId_branchId", ["productId", "branchId"]),

  alertSettings: defineTable({
    minWeeksOnFloor: v.number(),
    minBranchesForNetworkAlert: v.number(),
    alertFrequency: v.union(v.literal("once"), v.literal("weekly")),
    updatedAt: v.string(),
  }),

  tradingEvents: defineTable({
    name: v.string(),
    description: v.string(),
    eventType: v.union(
      v.literal("collection_launch"),
      v.literal("markdown"),
      v.literal("promotion")
    ),
    startDate: v.string(),
    endDate: v.string(),
    actions: v.array(
      v.object({
        type: v.string(),
        value: v.string(),
        description: v.optional(v.string()),
      })
    ),
    reminderDaysBefore: v.optional(v.number()),
    linkedBranchIds: v.array(v.id("branches")),
    linkedProductFilters: v.optional(
      v.object({
        department: v.optional(v.string()),
        category: v.optional(v.string()),
        collection: v.optional(v.string()),
      })
    ),
    createdByUserId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_startDate", ["startDate"])
    .index("by_eventType", ["eventType"])
    .index("by_createdByUserId", ["createdByUserId"]),

  agingPolicies: defineTable({
    classification: v.union(
      v.literal("Slow"),
      v.literal("Mid"),
      v.literal("Fast")
    ),
    minWeeks: v.number(),
    maxWeeks: v.optional(v.number()), // undefined = open-ended (no upper bound)
    recommendedAction: v.string(),
    priority: v.number(), // sort order; lower = displayed first
    updatedAt: v.string(),
  }).index("by_classification", ["classification"]),

  // ========================================
  // Snapshot tables (pre-computed for scale)
  // ========================================

  networkSnapshots: defineTable({
    date: v.string(),
    totalProducts: v.number(),
    totalBranches: v.number(),
    networkSellThru: v.number(),
    totalBeg: v.number(),
    totalSold: v.number(),
    totalSOH: v.number(),
    slowMoverCount: v.number(),
    fastMoverCount: v.number(),
    midMoverCount: v.number(),
    totalRetailValue: v.number(),
    updatedAt: v.string(),
  }).index("by_date", ["date"]),

  branchSnapshots: defineTable({
    date: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    totalProducts: v.number(),
    totalBeg: v.number(),
    totalSold: v.number(),
    totalSOH: v.number(),
    sellThru: v.number(),
    slowMoverCount: v.number(),
    fastMoverCount: v.number(),
    midMoverCount: v.number(),
    rank: v.number(),
    updatedAt: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_date_branchId", ["date", "branchId"]),

  productSnapshots: defineTable({
    date: v.string(),
    productId: v.id("products"),
    styleCode: v.string(),
    productName: v.string(),
    category: v.string(),
    department: v.string(),
    networkBeg: v.number(),
    networkSold: v.number(),
    networkSOH: v.number(),
    networkSellThru: v.number(),
    classification: v.string(),
    branchCount: v.number(),
    updatedAt: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_date_productId", ["date", "productId"]),
});
