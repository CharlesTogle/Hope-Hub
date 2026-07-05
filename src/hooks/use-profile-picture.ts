import { useQuery } from '@tanstack/react-query';
import supabase from '@/client/supabase';
import { profileKeys } from '@/lib/query-keys';
import { logger } from '@/utilities/logger';

export function useProfilePicture(userId: string | null): Blob | null {
  const { data } = useQuery({
    queryKey: profileKeys.picture(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .download(`${userId}/profilePicture`);
      if (error) {
        if (!error.message?.includes('404')) {
          logger.error('useProfilePicture download failed', error, { userId });
        }
        return null;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
  return data ?? null;
}
