import supabase from '@/client/supabase';

export async function getStudentsByClassCode (classCode, teacherId) {
  const { data, error } = await supabase.rpc('retrieve_students_by_class', {
    class_code_input: classCode,
    teacher_id_input: teacherId,
  });

  if (error) {
    return [];
  }
  return data;
}
