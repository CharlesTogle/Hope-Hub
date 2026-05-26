import supabase from '@/client/supabase';
import type { Profile } from '@/types/auth';

export interface AuthSessionData {
  userId: string | null;
  profile: Profile | null;
}

export async function fetchAuthenticatedProfile(): Promise<AuthSessionData> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('fetchAuthenticatedProfile getSession failed', {
      sessionError,
    });
    return {
      userId: null,
      profile: null,
    };
  }

  if (!session) {
    return {
      userId: null,
      profile: null,
    };
  }

  const { data, error } = await supabase
    .from('profile')
    .select('uuid, user_type, full_name, email')
    .eq('uuid', session.user.id)
    .single();

  if (error) {
    console.error('fetchAuthenticatedProfile profile lookup failed', {
      userId: session.user.id,
      error,
    });
    return {
      userId: null,
      profile: null,
    };
  }

  return {
    userId: session.user.id,
    profile: data as Profile,
  };
}
