import { create } from 'zustand';
import supabase from '@/client/supabase';
import type { Profile } from '@/types/auth';
import { logger } from '@/utilities/logger';

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  isLoading: boolean;

  setAuthState: (auth: { userId: string | null; profile: Profile | null }) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearAuthState: () => void;
  logout: () => Promise<{ remoteSignOutSucceeded: boolean }>;
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
    let remoteSignOutSucceeded = true;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        remoteSignOutSucceeded = false;
        logger.error('Logout failed', error);
      }
    } catch (error) {
      remoteSignOutSucceeded = false;
      logger.error('Logout failed', error);
    }
    localStorage.removeItem('lectureProgress');
    localStorage.removeItem('physicalFitnessData');
    set(loggedOutState);
    return { remoteSignOutSucceeded };
  },
}));
