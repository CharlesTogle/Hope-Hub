import supabase from '@/client/supabase';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';

export async function savePftSession(
  userId: string,
  testType: PFTColumnName,
  sessionData: PFTSessionData,
  classCode: string | null = null,
  isTeacher = false,
): Promise<void> {
  const update = testType === 'pre_physical_fitness_test'
    ? { pre_physical_fitness_test: sessionData }
    : { post_physical_fitness_test: sessionData };
  if (!isTeacher && !classCode) {
    throw new Error('Cannot save student PFT session without a class code.');
  }
  const { error } = isTeacher
    ? await supabase
        .from('physical_fitness_test')
        .upsert({ uuid: userId, ...update }, { onConflict: 'uuid' })
    : await supabase
        .from('class_physical_fitness_test')
        .upsert({ uuid: userId, class_code: classCode!, ...update }, { onConflict: 'uuid,class_code' });

  if (error) {
    throw error;
  }
}
