import supabase from '@/client/supabase';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';
import type { Database } from '@/types/supabase';

export async function savePftSession(
  userId: string,
  testType: PFTColumnName,
  sessionData: PFTSessionData,
): Promise<void> {
  const update: Database['public']['Tables']['physical_fitness_test']['Update'] =
    testType === 'pre_physical_fitness_test'
      ? { pre_physical_fitness_test: sessionData }
      : { post_physical_fitness_test: sessionData };
  const { error } = await supabase
    .from('physical_fitness_test')
    .update(update)
    .eq('uuid', userId);

  if (error) {
    throw error;
  }
}
