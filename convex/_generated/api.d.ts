/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_createUser from "../actions/createUser.js";
import type * as crons from "../crons.js";
import type * as helpers_allocation from "../helpers/allocation.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_autonomousExecution from "../helpers/autonomousExecution.js";
import type * as helpers_feedbackProcessing from "../helpers/feedbackProcessing.js";
import type * as helpers_forecast from "../helpers/forecast.js";
import type * as helpers_mlTraining from "../helpers/mlTraining.js";
import type * as helpers_pnl from "../helpers/pnl.js";
import type * as helpers_replenishment from "../helpers/replenishment.js";
import type * as helpers_sellThru from "../helpers/sellThru.js";
import type * as helpers_trendCalculation from "../helpers/trendCalculation.js";
import type * as helpers_weatherCorrelation from "../helpers/weatherCorrelation.js";
import type * as http from "../http.js";
import type * as mutations_adminSubmitFeedback from "../mutations/adminSubmitFeedback.js";
import type * as mutations_allocateWarehouseStock from "../mutations/allocateWarehouseStock.js";
import type * as mutations_approveTransfer from "../mutations/approveTransfer.js";
import type * as mutations_assignBranchProduct from "../mutations/assignBranchProduct.js";
import type * as mutations_autonomousGuardrails from "../mutations/autonomousGuardrails.js";
import type * as mutations_computeForecast from "../mutations/computeForecast.js";
import type * as mutations_computeSnapshots from "../mutations/computeSnapshots.js";
import type * as mutations_confirmAllocation from "../mutations/confirmAllocation.js";
import type * as mutations_confirmReplenishmentSuggestion from "../mutations/confirmReplenishmentSuggestion.js";
import type * as mutations_createBranch from "../mutations/createBranch.js";
import type * as mutations_createManualPO from "../mutations/createManualPO.js";
import type * as mutations_createProduct from "../mutations/createProduct.js";
import type * as mutations_createReplenishmentRule from "../mutations/createReplenishmentRule.js";
import type * as mutations_createSalesEntry from "../mutations/createSalesEntry.js";
import type * as mutations_createSupplier from "../mutations/createSupplier.js";
import type * as mutations_createTradingEvent from "../mutations/createTradingEvent.js";
import type * as mutations_createTransferRequest from "../mutations/createTransferRequest.js";
import type * as mutations_createUserRecord from "../mutations/createUserRecord.js";
import type * as mutations_deactivateUser from "../mutations/deactivateUser.js";
import type * as mutations_deleteReplenishmentRule from "../mutations/deleteReplenishmentRule.js";
import type * as mutations_deleteSalesEntry from "../mutations/deleteSalesEntry.js";
import type * as mutations_deleteSupplier from "../mutations/deleteSupplier.js";
import type * as mutations_deleteTradingEvent from "../mutations/deleteTradingEvent.js";
import type * as mutations_dismissReplenishmentSuggestion from "../mutations/dismissReplenishmentSuggestion.js";
import type * as mutations_evaluateMarkdownRules from "../mutations/evaluateMarkdownRules.js";
import type * as mutations_evaluateReorderPoints from "../mutations/evaluateReorderPoints.js";
import type * as mutations_feedbackThemes from "../mutations/feedbackThemes.js";
import type * as mutations_fetchWeatherData from "../mutations/fetchWeatherData.js";
import type * as mutations_generateAutonomousDigest from "../mutations/generateAutonomousDigest.js";
import type * as mutations_generateMLForecast from "../mutations/generateMLForecast.js";
import type * as mutations_generateSlowMoverAlerts from "../mutations/generateSlowMoverAlerts.js";
import type * as mutations_generateUploadUrl from "../mutations/generateUploadUrl.js";
import type * as mutations_loyaltySync from "../mutations/loyaltySync.js";
import type * as mutations_markAllNotificationsRead from "../mutations/markAllNotificationsRead.js";
import type * as mutations_markNotificationRead from "../mutations/markNotificationRead.js";
import type * as mutations_markdownRules from "../mutations/markdownRules.js";
import type * as mutations_posConfig from "../mutations/posConfig.js";
import type * as mutations_processPosTransaction from "../mutations/processPosTransaction.js";
import type * as mutations_purchaseOrders from "../mutations/purchaseOrders.js";
import type * as mutations_recordDelivery from "../mutations/recordDelivery.js";
import type * as mutations_recordWarehouseInbound from "../mutations/recordWarehouseInbound.js";
import type * as mutations_refreshExchangeRates from "../mutations/refreshExchangeRates.js";
import type * as mutations_regions from "../mutations/regions.js";
import type * as mutations_rejectTransfer from "../mutations/rejectTransfer.js";
import type * as mutations_reorderRules from "../mutations/reorderRules.js";
import type * as mutations_resolveAutonomousAction from "../mutations/resolveAutonomousAction.js";
import type * as mutations_resolveMarkdownProposal from "../mutations/resolveMarkdownProposal.js";
import type * as mutations_runAutonomousPipeline from "../mutations/runAutonomousPipeline.js";
import type * as mutations_seedData from "../mutations/seedData.js";
import type * as mutations_seedSettings from "../mutations/seedSettings.js";
import type * as mutations_seedTradingEvents from "../mutations/seedTradingEvents.js";
import type * as mutations_seedWarehouseStock from "../mutations/seedWarehouseStock.js";
import type * as mutations_submitFeedback from "../mutations/submitFeedback.js";
import type * as mutations_switchRole from "../mutations/switchRole.js";
import type * as mutations_syncUser from "../mutations/syncUser.js";
import type * as mutations_toggleReplenishmentRule from "../mutations/toggleReplenishmentRule.js";
import type * as mutations_triggerMLTraining from "../mutations/triggerMLTraining.js";
import type * as mutations_triggerSnapshotCompute from "../mutations/triggerSnapshotCompute.js";
import type * as mutations_undoAutonomousAction from "../mutations/undoAutonomousAction.js";
import type * as mutations_updateAgingPolicies from "../mutations/updateAgingPolicies.js";
import type * as mutations_updateAlertSettings from "../mutations/updateAlertSettings.js";
import type * as mutations_updateBranch from "../mutations/updateBranch.js";
import type * as mutations_updateBranchProduct from "../mutations/updateBranchProduct.js";
import type * as mutations_updateProduct from "../mutations/updateProduct.js";
import type * as mutations_updateReplenishmentRule from "../mutations/updateReplenishmentRule.js";
import type * as mutations_updateSalesEntry from "../mutations/updateSalesEntry.js";
import type * as mutations_updateSupplier from "../mutations/updateSupplier.js";
import type * as mutations_updateThresholds from "../mutations/updateThresholds.js";
import type * as mutations_updateTradingEvent from "../mutations/updateTradingEvent.js";
import type * as mutations_updateUser from "../mutations/updateUser.js";
import type * as mutations_weatherLocations from "../mutations/weatherLocations.js";
import type * as queries_branchBenchmarks from "../queries/branchBenchmarks.js";
import type * as queries_categoryBenchmarks from "../queries/categoryBenchmarks.js";
import type * as queries_checkEmailExists from "../queries/checkEmailExists.js";
import type * as queries_dashboardStats from "../queries/dashboardStats.js";
import type * as queries_feedbackSellThruCorrelation from "../queries/feedbackSellThruCorrelation.js";
import type * as queries_forecastABAccuracy from "../queries/forecastABAccuracy.js";
import type * as queries_forecastABComparison from "../queries/forecastABComparison.js";
import type * as queries_forecastAccuracy from "../queries/forecastAccuracy.js";
import type * as queries_getAgingPolicies from "../queries/getAgingPolicies.js";
import type * as queries_getAgingSummary from "../queries/getAgingSummary.js";
import type * as queries_getAlertSettings from "../queries/getAlertSettings.js";
import type * as queries_getAllocationRecommendation from "../queries/getAllocationRecommendation.js";
import type * as queries_getBranch from "../queries/getBranch.js";
import type * as queries_getCurrentUser from "../queries/getCurrentUser.js";
import type * as queries_getCurrentUserRole from "../queries/getCurrentUserRole.js";
import type * as queries_getDecliningSellThru from "../queries/getDecliningSellThru.js";
import type * as queries_getGuardrails from "../queries/getGuardrails.js";
import type * as queries_getMarginErosion from "../queries/getMarginErosion.js";
import type * as queries_getNetworkPnL from "../queries/getNetworkPnL.js";
import type * as queries_getNetworkSnapshot from "../queries/getNetworkSnapshot.js";
import type * as queries_getPosConfigByBranch from "../queries/getPosConfigByBranch.js";
import type * as queries_getProduct from "../queries/getProduct.js";
import type * as queries_getProductForecast from "../queries/getProductForecast.js";
import type * as queries_getProductSnapshots from "../queries/getProductSnapshots.js";
import type * as queries_getRuleHistory from "../queries/getRuleHistory.js";
import type * as queries_getSellThruByBranch from "../queries/getSellThruByBranch.js";
import type * as queries_getSellThruNetwork from "../queries/getSellThruNetwork.js";
import type * as queries_getSettings from "../queries/getSettings.js";
import type * as queries_getStaffBranchProducts from "../queries/getStaffBranchProducts.js";
import type * as queries_getThresholdImpact from "../queries/getThresholdImpact.js";
import type * as queries_getTrendComparison from "../queries/getTrendComparison.js";
import type * as queries_getTrendData from "../queries/getTrendData.js";
import type * as queries_getUpcomingEvents from "../queries/getUpcomingEvents.js";
import type * as queries_getWarehouseStock from "../queries/getWarehouseStock.js";
import type * as queries_getWeatherForLocation from "../queries/getWeatherForLocation.js";
import type * as queries_listActiveBranches from "../queries/listActiveBranches.js";
import type * as queries_listAllBranchProducts from "../queries/listAllBranchProducts.js";
import type * as queries_listAllBranches from "../queries/listAllBranches.js";
import type * as queries_listAllocationHistory from "../queries/listAllocationHistory.js";
import type * as queries_listAutonomousActions from "../queries/listAutonomousActions.js";
import type * as queries_listBranchProducts from "../queries/listBranchProducts.js";
import type * as queries_listBranches from "../queries/listBranches.js";
import type * as queries_listFeedbackThemes from "../queries/listFeedbackThemes.js";
import type * as queries_listMLModels from "../queries/listMLModels.js";
import type * as queries_listMarkdownProposals from "../queries/listMarkdownProposals.js";
import type * as queries_listMarkdownRules from "../queries/listMarkdownRules.js";
import type * as queries_listMyBranchProducts from "../queries/listMyBranchProducts.js";
import type * as queries_listMySalesEntries from "../queries/listMySalesEntries.js";
import type * as queries_listNotifications from "../queries/listNotifications.js";
import type * as queries_listPosConfigs from "../queries/listPosConfigs.js";
import type * as queries_listPosTransactions from "../queries/listPosTransactions.js";
import type * as queries_listProducts from "../queries/listProducts.js";
import type * as queries_listProductsByDepartment from "../queries/listProductsByDepartment.js";
import type * as queries_listPurchaseOrders from "../queries/listPurchaseOrders.js";
import type * as queries_listReorderRules from "../queries/listReorderRules.js";
import type * as queries_listReplenishmentRules from "../queries/listReplenishmentRules.js";
import type * as queries_listReplenishmentSuggestions from "../queries/listReplenishmentSuggestions.js";
import type * as queries_listSuppliers2 from "../queries/listSuppliers2.js";
import type * as queries_listTradingEvents from "../queries/listTradingEvents.js";
import type * as queries_listTransfers from "../queries/listTransfers.js";
import type * as queries_listUsers from "../queries/listUsers.js";
import type * as queries_listWeatherLocations from "../queries/listWeatherLocations.js";
import type * as queries_loyaltyQueries from "../queries/loyaltyQueries.js";
import type * as queries_posSyncStatus from "../queries/posSyncStatus.js";
import type * as queries_productFeedbackSummary from "../queries/productFeedbackSummary.js";
import type * as queries_publicProductList from "../queries/publicProductList.js";
import type * as queries_recentActivity from "../queries/recentActivity.js";
import type * as queries_regionQueries from "../queries/regionQueries.js";
import type * as queries_supplierRankings from "../queries/supplierRankings.js";
import type * as queries_supplierScorecard from "../queries/supplierScorecard.js";
import type * as queries_weatherCorrelationData from "../queries/weatherCorrelationData.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/createUser": typeof actions_createUser;
  crons: typeof crons;
  "helpers/allocation": typeof helpers_allocation;
  "helpers/auth": typeof helpers_auth;
  "helpers/autonomousExecution": typeof helpers_autonomousExecution;
  "helpers/feedbackProcessing": typeof helpers_feedbackProcessing;
  "helpers/forecast": typeof helpers_forecast;
  "helpers/mlTraining": typeof helpers_mlTraining;
  "helpers/pnl": typeof helpers_pnl;
  "helpers/replenishment": typeof helpers_replenishment;
  "helpers/sellThru": typeof helpers_sellThru;
  "helpers/trendCalculation": typeof helpers_trendCalculation;
  "helpers/weatherCorrelation": typeof helpers_weatherCorrelation;
  http: typeof http;
  "mutations/adminSubmitFeedback": typeof mutations_adminSubmitFeedback;
  "mutations/allocateWarehouseStock": typeof mutations_allocateWarehouseStock;
  "mutations/approveTransfer": typeof mutations_approveTransfer;
  "mutations/assignBranchProduct": typeof mutations_assignBranchProduct;
  "mutations/autonomousGuardrails": typeof mutations_autonomousGuardrails;
  "mutations/computeForecast": typeof mutations_computeForecast;
  "mutations/computeSnapshots": typeof mutations_computeSnapshots;
  "mutations/confirmAllocation": typeof mutations_confirmAllocation;
  "mutations/confirmReplenishmentSuggestion": typeof mutations_confirmReplenishmentSuggestion;
  "mutations/createBranch": typeof mutations_createBranch;
  "mutations/createManualPO": typeof mutations_createManualPO;
  "mutations/createProduct": typeof mutations_createProduct;
  "mutations/createReplenishmentRule": typeof mutations_createReplenishmentRule;
  "mutations/createSalesEntry": typeof mutations_createSalesEntry;
  "mutations/createSupplier": typeof mutations_createSupplier;
  "mutations/createTradingEvent": typeof mutations_createTradingEvent;
  "mutations/createTransferRequest": typeof mutations_createTransferRequest;
  "mutations/createUserRecord": typeof mutations_createUserRecord;
  "mutations/deactivateUser": typeof mutations_deactivateUser;
  "mutations/deleteReplenishmentRule": typeof mutations_deleteReplenishmentRule;
  "mutations/deleteSalesEntry": typeof mutations_deleteSalesEntry;
  "mutations/deleteSupplier": typeof mutations_deleteSupplier;
  "mutations/deleteTradingEvent": typeof mutations_deleteTradingEvent;
  "mutations/dismissReplenishmentSuggestion": typeof mutations_dismissReplenishmentSuggestion;
  "mutations/evaluateMarkdownRules": typeof mutations_evaluateMarkdownRules;
  "mutations/evaluateReorderPoints": typeof mutations_evaluateReorderPoints;
  "mutations/feedbackThemes": typeof mutations_feedbackThemes;
  "mutations/fetchWeatherData": typeof mutations_fetchWeatherData;
  "mutations/generateAutonomousDigest": typeof mutations_generateAutonomousDigest;
  "mutations/generateMLForecast": typeof mutations_generateMLForecast;
  "mutations/generateSlowMoverAlerts": typeof mutations_generateSlowMoverAlerts;
  "mutations/generateUploadUrl": typeof mutations_generateUploadUrl;
  "mutations/loyaltySync": typeof mutations_loyaltySync;
  "mutations/markAllNotificationsRead": typeof mutations_markAllNotificationsRead;
  "mutations/markNotificationRead": typeof mutations_markNotificationRead;
  "mutations/markdownRules": typeof mutations_markdownRules;
  "mutations/posConfig": typeof mutations_posConfig;
  "mutations/processPosTransaction": typeof mutations_processPosTransaction;
  "mutations/purchaseOrders": typeof mutations_purchaseOrders;
  "mutations/recordDelivery": typeof mutations_recordDelivery;
  "mutations/recordWarehouseInbound": typeof mutations_recordWarehouseInbound;
  "mutations/refreshExchangeRates": typeof mutations_refreshExchangeRates;
  "mutations/regions": typeof mutations_regions;
  "mutations/rejectTransfer": typeof mutations_rejectTransfer;
  "mutations/reorderRules": typeof mutations_reorderRules;
  "mutations/resolveAutonomousAction": typeof mutations_resolveAutonomousAction;
  "mutations/resolveMarkdownProposal": typeof mutations_resolveMarkdownProposal;
  "mutations/runAutonomousPipeline": typeof mutations_runAutonomousPipeline;
  "mutations/seedData": typeof mutations_seedData;
  "mutations/seedSettings": typeof mutations_seedSettings;
  "mutations/seedTradingEvents": typeof mutations_seedTradingEvents;
  "mutations/seedWarehouseStock": typeof mutations_seedWarehouseStock;
  "mutations/submitFeedback": typeof mutations_submitFeedback;
  "mutations/switchRole": typeof mutations_switchRole;
  "mutations/syncUser": typeof mutations_syncUser;
  "mutations/toggleReplenishmentRule": typeof mutations_toggleReplenishmentRule;
  "mutations/triggerMLTraining": typeof mutations_triggerMLTraining;
  "mutations/triggerSnapshotCompute": typeof mutations_triggerSnapshotCompute;
  "mutations/undoAutonomousAction": typeof mutations_undoAutonomousAction;
  "mutations/updateAgingPolicies": typeof mutations_updateAgingPolicies;
  "mutations/updateAlertSettings": typeof mutations_updateAlertSettings;
  "mutations/updateBranch": typeof mutations_updateBranch;
  "mutations/updateBranchProduct": typeof mutations_updateBranchProduct;
  "mutations/updateProduct": typeof mutations_updateProduct;
  "mutations/updateReplenishmentRule": typeof mutations_updateReplenishmentRule;
  "mutations/updateSalesEntry": typeof mutations_updateSalesEntry;
  "mutations/updateSupplier": typeof mutations_updateSupplier;
  "mutations/updateThresholds": typeof mutations_updateThresholds;
  "mutations/updateTradingEvent": typeof mutations_updateTradingEvent;
  "mutations/updateUser": typeof mutations_updateUser;
  "mutations/weatherLocations": typeof mutations_weatherLocations;
  "queries/branchBenchmarks": typeof queries_branchBenchmarks;
  "queries/categoryBenchmarks": typeof queries_categoryBenchmarks;
  "queries/checkEmailExists": typeof queries_checkEmailExists;
  "queries/dashboardStats": typeof queries_dashboardStats;
  "queries/feedbackSellThruCorrelation": typeof queries_feedbackSellThruCorrelation;
  "queries/forecastABAccuracy": typeof queries_forecastABAccuracy;
  "queries/forecastABComparison": typeof queries_forecastABComparison;
  "queries/forecastAccuracy": typeof queries_forecastAccuracy;
  "queries/getAgingPolicies": typeof queries_getAgingPolicies;
  "queries/getAgingSummary": typeof queries_getAgingSummary;
  "queries/getAlertSettings": typeof queries_getAlertSettings;
  "queries/getAllocationRecommendation": typeof queries_getAllocationRecommendation;
  "queries/getBranch": typeof queries_getBranch;
  "queries/getCurrentUser": typeof queries_getCurrentUser;
  "queries/getCurrentUserRole": typeof queries_getCurrentUserRole;
  "queries/getDecliningSellThru": typeof queries_getDecliningSellThru;
  "queries/getGuardrails": typeof queries_getGuardrails;
  "queries/getMarginErosion": typeof queries_getMarginErosion;
  "queries/getNetworkPnL": typeof queries_getNetworkPnL;
  "queries/getNetworkSnapshot": typeof queries_getNetworkSnapshot;
  "queries/getPosConfigByBranch": typeof queries_getPosConfigByBranch;
  "queries/getProduct": typeof queries_getProduct;
  "queries/getProductForecast": typeof queries_getProductForecast;
  "queries/getProductSnapshots": typeof queries_getProductSnapshots;
  "queries/getRuleHistory": typeof queries_getRuleHistory;
  "queries/getSellThruByBranch": typeof queries_getSellThruByBranch;
  "queries/getSellThruNetwork": typeof queries_getSellThruNetwork;
  "queries/getSettings": typeof queries_getSettings;
  "queries/getStaffBranchProducts": typeof queries_getStaffBranchProducts;
  "queries/getThresholdImpact": typeof queries_getThresholdImpact;
  "queries/getTrendComparison": typeof queries_getTrendComparison;
  "queries/getTrendData": typeof queries_getTrendData;
  "queries/getUpcomingEvents": typeof queries_getUpcomingEvents;
  "queries/getWarehouseStock": typeof queries_getWarehouseStock;
  "queries/getWeatherForLocation": typeof queries_getWeatherForLocation;
  "queries/listActiveBranches": typeof queries_listActiveBranches;
  "queries/listAllBranchProducts": typeof queries_listAllBranchProducts;
  "queries/listAllBranches": typeof queries_listAllBranches;
  "queries/listAllocationHistory": typeof queries_listAllocationHistory;
  "queries/listAutonomousActions": typeof queries_listAutonomousActions;
  "queries/listBranchProducts": typeof queries_listBranchProducts;
  "queries/listBranches": typeof queries_listBranches;
  "queries/listFeedbackThemes": typeof queries_listFeedbackThemes;
  "queries/listMLModels": typeof queries_listMLModels;
  "queries/listMarkdownProposals": typeof queries_listMarkdownProposals;
  "queries/listMarkdownRules": typeof queries_listMarkdownRules;
  "queries/listMyBranchProducts": typeof queries_listMyBranchProducts;
  "queries/listMySalesEntries": typeof queries_listMySalesEntries;
  "queries/listNotifications": typeof queries_listNotifications;
  "queries/listPosConfigs": typeof queries_listPosConfigs;
  "queries/listPosTransactions": typeof queries_listPosTransactions;
  "queries/listProducts": typeof queries_listProducts;
  "queries/listProductsByDepartment": typeof queries_listProductsByDepartment;
  "queries/listPurchaseOrders": typeof queries_listPurchaseOrders;
  "queries/listReorderRules": typeof queries_listReorderRules;
  "queries/listReplenishmentRules": typeof queries_listReplenishmentRules;
  "queries/listReplenishmentSuggestions": typeof queries_listReplenishmentSuggestions;
  "queries/listSuppliers2": typeof queries_listSuppliers2;
  "queries/listTradingEvents": typeof queries_listTradingEvents;
  "queries/listTransfers": typeof queries_listTransfers;
  "queries/listUsers": typeof queries_listUsers;
  "queries/listWeatherLocations": typeof queries_listWeatherLocations;
  "queries/loyaltyQueries": typeof queries_loyaltyQueries;
  "queries/posSyncStatus": typeof queries_posSyncStatus;
  "queries/productFeedbackSummary": typeof queries_productFeedbackSummary;
  "queries/publicProductList": typeof queries_publicProductList;
  "queries/recentActivity": typeof queries_recentActivity;
  "queries/regionQueries": typeof queries_regionQueries;
  "queries/supplierRankings": typeof queries_supplierRankings;
  "queries/supplierScorecard": typeof queries_supplierScorecard;
  "queries/weatherCorrelationData": typeof queries_weatherCorrelationData;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
