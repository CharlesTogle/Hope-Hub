import { create } from 'zustand';
import supabase from '@/client/supabase';
import type { Profile } from '@/types/auth';

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  isLoading: boolean;

  setAuthState: (auth: { userId: string | null; profile: Profile | null }) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearAuthState: () => void;
  logout: () => Promise<void>;
}

const initialState = {
  userId: null as string | null,
  profile: null as Profile | null,
  isLoading: true,
};

const loggedOutState = {
  userId: null as string | null,
  profile: null as Profile | null,
  isLoading: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setAuthState: ({ userId, profile }) =>
    set({
      userId,
      profile,
      isLoading: false,
    }),

  setIsLoading: (isLoading) => set({ isLoading }),

  clearAuthState: () => set(loggedOutState),

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lectureProgress');
    localStorage.removeItem('physicalFitnessData');
    set(loggedOutState);
  },
}));
