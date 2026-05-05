import { create } from 'zustand';
import getDataFromStorage from '@/utilities/getDataFromStorage';
import setDataToStorage from '@/utilities/setDataToStorage';
import {
  PFT_STORAGE_KEY,
  getStoredOrDefaultPftSessionData,
} from '@/lib/pft-session';
import type { PFTSessionData } from '@/types/physical-fitness';

interface PhysicalFitnessState {
  sessionData: PFTSessionData;
  setSessionData: (data: PFTSessionData) => void;
  updateField: <K extends keyof PFTSessionData>(key: K, value: PFTSessionData[K]) => void;
  clearSessionData: () => void;
  reset: () => void;
}

function getInitialSessionData(): PFTSessionData {
  if (typeof window === 'undefined') {
    return getStoredOrDefaultPftSessionData(null);
  }

  return getStoredOrDefaultPftSessionData(
    getDataFromStorage<PFTSessionData>(PFT_STORAGE_KEY),
  );
}

const initialState = () => ({
  sessionData: getInitialSessionData(),
});

export const usePhysicalFitnessStore = create<PhysicalFitnessState>((set) => ({
  ...initialState(),

  setSessionData: (data) => {
    setDataToStorage(PFT_STORAGE_KEY, data);
    set({ sessionData: data });
  },

  updateField: (key, value) =>
    set((state) => {
      const nextSessionData = {
        ...state.sessionData,
        [key]: value,
      };

      setDataToStorage(PFT_STORAGE_KEY, nextSessionData);

      return { sessionData: nextSessionData };
    }),
  clearSessionData: () => {
    localStorage.removeItem(PFT_STORAGE_KEY);
    set({ sessionData: getStoredOrDefaultPftSessionData(null) });
  },

  reset: () => set(initialState()),
}));
