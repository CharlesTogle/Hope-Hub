import { createClient } from '@supabase/supabase-js';
// @ts-check
/** @typedef {import('@/types/supabase').Database} Database */

const rememberMe = localStorage.getItem('rememberMe') === 'true';

/** @type {import('@supabase/supabase-js').SupabaseClient<Database>} */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
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
