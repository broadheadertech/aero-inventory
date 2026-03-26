import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NetworkDashboardState {
  branchFilter: string; // Id<"branches"> as string, or ""
  departmentFilter: string;
  categoryFilter: string;
  collectionFilter: string;
  timePeriod: string;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  drillDownBranchId: string | null; // Id<"branches"> as string
  drillDownBranchName: string | null;
  setBranchFilter: (val: string) => void;
  setDepartmentFilter: (val: string) => void;
  setCategoryFilter: (val: string) => void;
  setCollectionFilter: (val: string) => void;
  setTimePeriod: (val: string) => void;
  setSortColumn: (col: string) => void;
  setSortDirection: (dir: "asc" | "desc") => void;
  handleSort: (col: string) => void;
  setDrillDown: (branchId: string, branchName: string) => void;
  clearDrillDown: () => void;
  resetFilters: () => void;
}

export const useNetworkDashboardStore = create<NetworkDashboardState>()(
  persist(
    (set, get) => ({
      branchFilter: "",
      departmentFilter: "",
      categoryFilter: "",
      collectionFilter: "",
      timePeriod: "weekly",
      sortColumn: "sellThruPercent",
      sortDirection: "asc",
      drillDownBranchId: null,
      drillDownBranchName: null,
      setBranchFilter: (val) => set({ branchFilter: val }),
      setDepartmentFilter: (val) => set({ departmentFilter: val }),
      setCategoryFilter: (val) => set({ categoryFilter: val }),
      setCollectionFilter: (val) => set({ collectionFilter: val }),
      setTimePeriod: (val) => set({ timePeriod: val }),
      setSortColumn: (col) => set({ sortColumn: col }),
      setSortDirection: (dir) => set({ sortDirection: dir }),
      handleSort: (col) => {
        const { sortColumn, sortDirection } = get();
        if (sortColumn === col) {
          set({ sortDirection: sortDirection === "asc" ? "desc" : "asc" });
        } else {
          set({ sortColumn: col, sortDirection: "asc" });
        }
      },
      setDrillDown: (branchId, branchName) =>
        set({ drillDownBranchId: branchId, drillDownBranchName: branchName }),
      clearDrillDown: () =>
        set({ drillDownBranchId: null, drillDownBranchName: null }),
      resetFilters: () =>
        set({
          branchFilter: "",
          departmentFilter: "",
          categoryFilter: "",
          collectionFilter: "",
          timePeriod: "weekly",
          sortColumn: "sellThruPercent",
          sortDirection: "asc",
          drillDownBranchId: null,
          drillDownBranchName: null,
        }),
    }),
    { name: "network-dashboard-filters" }
  )
);
