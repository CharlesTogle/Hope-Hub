import supabase from '@/client/supabase';
import type { RawStudentData } from '@/types/student';
import { logger } from '@/utilities/logger';

export async function getStudentsByClassCode(
  classCode: string,
): Promise<RawStudentData[]> {
  const { data, error } = await supabase.rpc('retrieve_students_by_class', {
    class_code_input: classCode,
  });

  if (error) {
    logger.error('getStudentsByClassCode failed', error, { classCode });
    return [];
  }
  return data ?? [];
}
