import { create } from 'zustand';
import type { PFTSessionData } from '@/types/physical-fitness';

interface PhysicalFitnessState {
  sessionData: PFTSessionData | null;
  setSessionData: (data: PFTSessionData) => void;
  updateField: <K extends keyof PFTSessionData>(key: K, value: PFTSessionData[K]) => void;
  reset: () => void;
}

const initialState = {
  sessionData: null as PFTSessionData | null,
};

export const usePhysicalFitnessStore = create<PhysicalFitnessState>((set) => ({
  ...initialState,

  setSessionData: (data) => set({ sessionData: data }),

  updateField: (key, value) =>
    set((s) => {
      if (!s.sessionData) return s;
      return { sessionData: { ...s.sessionData, [key]: value } };
    }),

  reset: () => set(initialState),
}));
