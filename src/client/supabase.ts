import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const REMEMBER_ME_STORAGE_KEY = 'rememberMe';

function prefersPersistentSession(): boolean {
  return localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
}

function getPreferredStorage(): Storage {
  return prefersPersistentSession() ? localStorage : sessionStorage;
}

function getFallbackStorage(storage: Storage): Storage {
  return storage === localStorage ? sessionStorage : localStorage;
}

const authStorage = {
  getItem(key: string) {
    const preferredStorage = getPreferredStorage();
    return (
      preferredStorage.getItem(key) ??
      getFallbackStorage(preferredStorage).getItem(key)
    );
  },
  setItem(key: string, value: string) {
    const preferredStorage = getPreferredStorage();
    const fallbackStorage = getFallbackStorage(preferredStorage);

    preferredStorage.setItem(key, value);
    fallbackStorage.removeItem(key);
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function setRememberMePreference(rememberMe: boolean): void {
  localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMe.toString());
}

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export default supabase;
