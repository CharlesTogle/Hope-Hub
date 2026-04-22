import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeModal: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  openModal: (id: string) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
