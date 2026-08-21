import supabase from '@/client/supabase';
import type { Profile } from '@/types/auth';
import { logger } from '@/utilities/logger';

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
    logger.error('fetchAuthenticatedProfile getSession failed', sessionError);
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

  const { error: provisioningError } = await supabase.rpc('ensure_current_user_data');
  if (provisioningError) {
    logger.error('fetchAuthenticatedProfile data provisioning failed', provisioningError, { userId: session.user.id });
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
    logger.error('fetchAuthenticatedProfile profile lookup failed', error, { userId: session.user.id });
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
