import supabase from '@/client/supabase';
import { derivePftStatus } from '@/lib/pft-session';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';
import { logger } from '@/utilities/logger';

export interface PFTRecordRow {
  pre_physical_fitness_test: PFTSessionData | null;
  post_physical_fitness_test: PFTSessionData | null;
}

export interface PFTStatus {
  isTaken: boolean;
  testType: PFTColumnName;
}

export type PFTSummaryRouteType = 'pre-test' | 'post-test';

export interface PFTSummaryRow {
  full_name: string | null;
  email: string | null;
  pft_data: PFTSessionData | null;
}

interface PFTProfileRow {
  full_name: string | null;
  email: string | null;
}

export async function fetchPftRecord(
  userId: string,
  classCode: string | null = null,
  isTeacher = false,
): Promise<PFTRecordRow | null> {
  if (!isTeacher && !classCode) return null;
  const { data, error } = isTeacher
    ? await supabase
        .from('physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userId)
        .maybeSingle()
    : await supabase
        .from('class_physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userId)
        .eq('class_code', classCode!)
        .maybeSingle();

  if (error) {
    logger.error('fetchPftRecord failed', error, { userId });
    throw error;
  }

  return data as PFTRecordRow;
}

export async function fetchPftStatus(
  userId: string,
  classCode: string | null = null,
  isTeacher = false,
): Promise<PFTStatus> {
  return derivePftStatus(await fetchPftRecord(userId, classCode, isTeacher));
}

export async function fetchPftSummaryForViewer(
  studentId: string,
  classCode: string,
  testType: PFTSummaryRouteType,
): Promise<PFTSummaryRow | null> {
  const { data, error } = await supabase.rpc('get_pft_summary_for_viewer', {
    p_student_uuid: studentId,
    p_class_code: classCode,
    p_test_type: testType,
  });

  if (!error && data?.[0]) {
    return data[0];
  }

  if (error && error.code !== 'PGRST116' && error.code !== 'PGRST202') {
    throw error;
  }

  const [{ data: profile, error: profileError }, { data: pftRecord, error: pftError }] = await Promise.all([
      supabase
        .from('profile')
        .select('full_name, email')
        .eq('uuid', studentId)
        .maybeSingle<PFTProfileRow>(),
      supabase
        .from('class_physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', studentId)
        .eq('class_code', classCode)
        .maybeSingle<PFTRecordRow>(),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (pftError) {
    throw pftError;
  }

  if (!profile) {
    return null;
  }

  return {
    full_name: profile.full_name,
    email: profile.email,
    pft_data:
      testType === 'pre-test'
        ? pftRecord?.pre_physical_fitness_test ?? null
        : pftRecord?.post_physical_fitness_test ?? null,
  };
}
