import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const rememberMe = localStorage.getItem('rememberMe') === 'true';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      storage: rememberMe ? localStorage : sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export default supabase;
