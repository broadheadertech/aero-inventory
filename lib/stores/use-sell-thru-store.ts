import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SellThruFilters = {
  department: string;
  category: string;
  collection: string;
  timePeriod: string;
  classificationFilter: "Fast" | "Mid" | "Slow" | null;
};

type SellThruStore = SellThruFilters & {
  // state
  department: string;
  category: string;
  collection: string;
  timePeriod: string;
  sortColumn: string;
  sortDirection: "asc" | "desc" | "default";
  classificationFilter: "Fast" | "Mid" | "Slow" | null;
  // actions
  setDepartment: (v: string) => void;
  setCategory: (v: string) => void;
  setCollection: (v: string) => void;
  setTimePeriod: (v: string) => void;
  setSortColumn: (col: string) => void;
  setSortDirection: (dir: "asc" | "desc" | "default") => void;
  setClassificationFilter: (v: "Fast" | "Mid" | "Slow" | null) => void;
  clearFilters: () => void;
};

export const useSellThruStore = create<SellThruStore>()(
  persist(
    (set) => ({
      department: "",
      category: "",
      collection: "",
      timePeriod: "weekly",
      sortColumn: "sellThruPercent",
      sortDirection: "default",
      classificationFilter: null,
      setDepartment: (v) => set({ department: v }),
      setCategory: (v) => set({ category: v }),
      setCollection: (v) => set({ collection: v }),
      setTimePeriod: (v) => set({ timePeriod: v }),
      setSortColumn: (col) => set({ sortColumn: col }),
      setSortDirection: (dir) => set({ sortDirection: dir }),
      setClassificationFilter: (v) => set({ classificationFilter: v }),
      clearFilters: () =>
        set({
          department: "",
          category: "",
          collection: "",
          timePeriod: "weekly",
          classificationFilter: null,
        }),
    }),
    { name: "sell-thru-filters" }
  )
);
