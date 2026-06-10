import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeSection: string;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeSection: "dashboard",

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCommandPaletteOpen: (open) =>
    set({ commandPaletteOpen: open }),

  setActiveSection: (section) =>
    set({ activeSection: section }),
}));
