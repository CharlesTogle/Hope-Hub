import supabase from '@/client/supabase';
import { derivePftStatus } from '@/lib/pft-session';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';

export interface PFTRecordRow {
  pre_physical_fitness_test: PFTSessionData | null;
  post_physical_fitness_test: PFTSessionData | null;
}

export interface PFTStatus {
  isTaken: boolean;
  testType: PFTColumnName;
}

export async function fetchPftRecord(
  userId: string,
): Promise<PFTRecordRow | null> {
  const { data, error } = await supabase
    .from('physical_fitness_test')
    .select('pre_physical_fitness_test, post_physical_fitness_test')
    .eq('uuid', userId)
    .single();

  if (error) {
    return null;
  }

  return data as PFTRecordRow;
}

export async function fetchPftStatus(userId: string): Promise<PFTStatus> {
  return derivePftStatus(await fetchPftRecord(userId));
}
