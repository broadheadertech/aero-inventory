import type { Id } from "@/convex/_generated/dataModel";

export type AgingProductRow = {
  branchProductId: Id<"branchProducts">;
  styleCode: string;
  productName: string;
  imageUrl: string | null;
  branchId: Id<"branches">;
  branchName: string;
  weeksOnFloor: number | null;
  sellThruPercent: number | null;
  currentSOH: number;
};

export type AgingBracketRow = {
  remark: string;
  priority: number;
  productCount: number;
  totalSOH: number;
  avgSellThruPercent: number | null;
  products: AgingProductRow[];
};
