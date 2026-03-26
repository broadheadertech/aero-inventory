import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StockOverviewState {
  searchQuery: string;
  branchFilter: string;
  departmentFilter: string;
  categoryFilter: string;
  collectionFilter: string;
  setSearchQuery: (q: string) => void;
  setBranchFilter: (b: string) => void;
  setDepartmentFilter: (d: string) => void;
  setCategoryFilter: (c: string) => void;
  setCollectionFilter: (c: string) => void;
  clearAllFilters: () => void;
}

export const useStockOverviewStore = create<StockOverviewState>()(
  persist(
    (set) => ({
      searchQuery: "",
      branchFilter: "",
      departmentFilter: "",
      categoryFilter: "",
      collectionFilter: "",
      setSearchQuery: (q) => set({ searchQuery: q }),
      setBranchFilter: (b) => set({ branchFilter: b }),
      setDepartmentFilter: (d) => set({ departmentFilter: d }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setCollectionFilter: (c) => set({ collectionFilter: c }),
      clearAllFilters: () =>
        set({ searchQuery: "", branchFilter: "", departmentFilter: "", categoryFilter: "", collectionFilter: "" }),
    }),
    { name: "stock-overview-filters" }
  )
);
