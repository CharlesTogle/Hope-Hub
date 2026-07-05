import { useQuery } from '@tanstack/react-query';
import supabase from '@/client/supabase';
import { profileKeys } from '@/lib/query-keys';

export function useProfilePicture(userId: string | null): Blob | null {
  const { data } = useQuery({
    queryKey: profileKeys.picture(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null;
      const folder = userId;
      const fileName = 'profilePicture';
      const { data: files, error: listError } = await supabase.storage
        .from('profile-pictures')
        .list(folder);
      if (listError) {
        console.error('Failed to list profile pictures', { userId, listError });
        return null;
      }
      const fileExists = files?.some((file) => file.name === fileName);
      if (!fileExists) return null;
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .download(`${folder}/${fileName}`);
      if (error || !data) return null;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
  return data ?? null;
}
