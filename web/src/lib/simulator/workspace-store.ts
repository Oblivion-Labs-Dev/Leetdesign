import { create } from "zustand";
import type { ComponentCategory, SimComponentType } from "./types";

export type WorkspaceMode = "compose" | "connect" | "run";
export type ShelfMode = "focused" | "browse";

interface WorkspaceState {
  mode: WorkspaceMode;
  shelfOpen: boolean;
  shelfMode: ShelfMode;
  activeCategory: ComponentCategory | null;
  categoryAnchorTop: number;
  missionExpanded: boolean;
  inspectorOpen: boolean;
  recentTypes: SimComponentType[];

  setMode: (mode: WorkspaceMode) => void;
  openFocusedCategory: (category: ComponentCategory, anchorTop?: number) => void;
  openBrowseShelf: () => void;
  closeShelf: () => void;
  toggleShelf: (category: ComponentCategory) => void;
  setActiveCategory: (category: ComponentCategory | null) => void;
  setMissionExpanded: (expanded: boolean) => void;
  toggleMission: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  pushRecent: (type: SimComponentType) => void;
  resetWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  mode: "compose",
  shelfOpen: false,
  shelfMode: "browse",
  activeCategory: null,
  categoryAnchorTop: 80,
  missionExpanded: false,
  inspectorOpen: false,
  recentTypes: [],

  setMode: (mode) => set({ mode, shelfOpen: mode === "compose" ? get().shelfOpen : false }),

  openFocusedCategory: (category, anchorTop = 80) =>
    set({
      shelfOpen: true,
      shelfMode: "focused",
      activeCategory: category,
      categoryAnchorTop: anchorTop,
      mode: "compose",
    }),

  openBrowseShelf: () =>
    set({ shelfOpen: true, shelfMode: "browse", activeCategory: null, mode: "compose" }),

  closeShelf: () => set({ shelfOpen: false }),

  toggleShelf: (category) => {
    const s = get();
    if (s.shelfOpen && s.shelfMode === "focused" && s.activeCategory === category) {
      set({ shelfOpen: false });
    } else {
      set({ shelfOpen: true, shelfMode: "focused", activeCategory: category, mode: "compose" });
    }
  },

  setActiveCategory: (activeCategory) => set({ activeCategory }),

  setMissionExpanded: (missionExpanded) => set({ missionExpanded }),
  toggleMission: () => set((s) => ({ missionExpanded: !s.missionExpanded })),

  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),

  pushRecent: (type) =>
    set((s) => ({
      recentTypes: [type, ...s.recentTypes.filter((t) => t !== type)].slice(0, 8),
    })),

  resetWorkspace: () =>
    set({
      mode: "compose",
      shelfOpen: false,
      shelfMode: "browse",
      activeCategory: null,
      categoryAnchorTop: 80,
      missionExpanded: false,
      inspectorOpen: false,
      recentTypes: [],
    }),
}));
