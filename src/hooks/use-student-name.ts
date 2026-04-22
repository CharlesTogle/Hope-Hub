import { useQuery } from '@tanstack/react-query';
import supabase from '@/client/supabase';
import { profileKeys } from '@/lib/query-keys';

export function useStudentName(userId: string | null): string {
  const { data } = useQuery({
    queryKey: profileKeys.name(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('full_name')
        .eq('uuid', userId!)
        .single();
      if (error || !data) return '';
      return data.full_name ?? '';
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
  return data ?? '';
}
