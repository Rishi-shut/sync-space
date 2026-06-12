import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeSection: string;
  toasts: Toast[];
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
  addToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeSection: "dashboard",
  toasts: [],

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCommandPaletteOpen: (open) =>
    set({ commandPaletteOpen: open }),

  setActiveSection: (section) =>
    set({ activeSection: section }),

  addToast: (message, type = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
