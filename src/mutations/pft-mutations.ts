import supabase from '@/client/supabase';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';

export async function savePftSession(
  userId: string,
  testType: PFTColumnName,
  sessionData: PFTSessionData,
): Promise<void> {
  const { error } = await supabase
    .from('physical_fitness_test')
    .update({ [testType]: sessionData })
    .eq('uuid', userId);

  if (error) {
    throw error;
  }
}
