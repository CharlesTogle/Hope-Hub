import { create } from 'zustand';
import supabase from '@/client/supabase';
import type { Profile } from '@/types/auth';

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  isLoading: boolean;

  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

const initialState = {
  userId: null as string | null,
  profile: null as Profile | null,
  isLoading: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  hydrate: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ isLoading: false });
      return;
    }

    const { data } = await supabase
      .from('profile')
      .select('uuid, user_type, full_name, email')
      .eq('uuid', session.user.id)
      .single();

    set({
      userId: session.user.id,
      profile: data as Profile | null,
      isLoading: false,
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lectureProgress');
    localStorage.removeItem('physicalFitnessData');
    set(initialState);
  },
}));
