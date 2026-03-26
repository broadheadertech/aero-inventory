import type { Id } from "@/convex/_generated/dataModel";

export type SellThruRow = {
  branchProductId: Id<"branchProducts">;
  branchId: Id<"branches">;
  productId: Id<"products">;
  styleCode: string;
  productName: string;
  imageUrl: string | null;
  department: string;
  category: string;
  collection: string;
  beginningStock: number;
  sold: number;
  currentSOH: number;
  sellThruPercent: number | null;
  classification: "Fast" | "Mid" | "Slow" | "N/A";
  weeksOnFloor: number | null;
  deliveryInStoreDate: string | null;
  retailPrice: number;
  unitCost: number;
  ads: number | null;
  dsi: number | null;
  mi: number | null;
  remark: string;
};

export type SellThruNetworkRow = SellThruRow & {
  branchName: string;
};
