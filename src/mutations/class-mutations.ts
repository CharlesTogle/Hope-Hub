import supabase from '@/client/supabase';
import type { ClassCode } from '@/types/student';

const CLASS_CODE_LENGTH = 6;
const CLASS_CODE_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function isValidClassCode(code: string): boolean {
  return code.length === CLASS_CODE_LENGTH;
}

export async function doesTeacherClassCodeExist(
  code: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from('teacher_class_code')
    .select('*', { count: 'exact', head: true })
    .eq('class_code', code);

  if (error) {
    throw new Error('Error checking class code. Please try again.');
  }

  return (count ?? 0) > 0;
}

export async function joinStudentClass(
  userId: string,
  classCode: string,
): Promise<void> {
  const { error } = await supabase
    .from('student_class_code')
    .update({ class_code: classCode })
    .eq('uuid', userId);

  if (error) {
    throw error;
  }
}

export async function leaveStudentClass(userId: string): Promise<void> {
  const { error } = await supabase
    .from('student_class_code')
    .update({ class_code: null })
    .eq('uuid', userId);

  if (error) {
    throw error;
  }
}

function generateClassCode(): string {
  let code = '';

  for (let i = 0; i < CLASS_CODE_LENGTH; i++) {
    code += CLASS_CODE_CHARACTERS.charAt(
      Math.floor(Math.random() * CLASS_CODE_CHARACTERS.length),
    );
  }

  return code;
}

async function isClassCodeUnique(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('teacher_class_code')
    .select('class_code')
    .eq('class_code', code);

  if (error) {
    return false;
  }

  return (data?.length ?? 0) === 0;
}

async function generateUniqueClassCode(): Promise<string> {
  let attempts = 0;
  let uniqueCode = '';

  while (attempts < 10) {
    const candidateCode = generateClassCode();
    const isUnique = await isClassCodeUnique(candidateCode);

    if (isUnique) {
      uniqueCode = candidateCode;
      break;
    }

    attempts++;
  }

  if (!uniqueCode) {
    throw new Error('Unable to generate unique class code. Please try again.');
  }

  return uniqueCode;
}

export async function createTeacherClassCode(
  teacherId: string,
  className: string,
  classColor: string,
): Promise<ClassCode> {
  const classCode = await generateUniqueClassCode();
  const { error } = await supabase.from('teacher_class_code').insert({
    uuid: teacherId,
    class_name: className,
    class_code: classCode,
    class_color: classColor,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create class: ${error.message}`);
  }

  return {
    class_name: className,
    class_code: classCode,
    class_color: classColor,
  };
}

export async function removeTeacherClassCode(
  teacherId: string,
  classCode: string,
): Promise<void> {
  const { error } = await supabase
    .from('teacher_class_code')
    .delete()
    .eq('class_code', classCode)
    .eq('uuid', teacherId);

  if (error) {
    throw error;
  }
}
