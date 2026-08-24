import supabase from '@/client/supabase';
import type { ClassCode, DashboardQuizRow, ProgressStats, StudentPftStatus } from '@/types/student';
import { logger } from '@/utilities/logger';
import { isFinishedTestIndexes } from '@/lib/pft-session';

export async function fetchLectureProgressSummary(
  userId: string,
): Promise<ProgressStats> {
  const { data, error } = await supabase
    .from('lecture_progress')
    .select('lecture_progress')
    .eq('uuid', userId)
    .maybeSingle();

  if (error) {
    logger.error('fetchLectureProgressSummary failed', error, { userId });
    throw error;
  }

  const lectures = data ? data.lecture_progress || [] : [];
  let completed = 0;
  let incomplete = 0;
  let pending = 0;

  lectures.forEach((item: { status: string }) => {
    if (item.status === 'Done') completed++;
    else if (item.status === 'Incomplete') incomplete++;
    else if (item.status === 'Pending') pending++;
  });

  return { completed, incomplete, pending, total: lectures.length };
}

export async function fetchQuizCount(): Promise<number> {
  const { count, error } = await supabase
    .from('quiz')
    .select('*', { count: 'exact', head: true });

  if (error) {
    logger.error('fetchQuizCount failed', error);
    throw error;
  }
  return (count ?? 0) + 1;
}

export async function fetchStudentQuizProgressSummary(
  userId: string,
  quizCount: number,
): Promise<ProgressStats> {
  const quizIds = Array.from({ length: quizCount }, (_, index) => index);
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('quiz_id, status')
    .eq('user_id', userId);

  if (error) {
    logger.error('fetchStudentQuizProgressSummary failed', error, { userId });
    throw error;
  }

  let completed = 0;
  let pending = 0;

  data.filter((item) => quizIds.includes(item.quiz_id)).forEach((item) => {
    if (item.status === 'Done') completed++;
    else if (item.status === 'Pending') pending++;
  });

  return {
    completed,
    incomplete: quizCount - completed - pending,
    pending,
    total: quizCount,
  };
}

export async function fetchStudentQuizRows(
  userId: string,
  quizCount: number,
): Promise<DashboardQuizRow[]> {
  const quizIds = Array.from({ length: quizCount }, (_, index) => index);
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('quiz_id, status, score, total_items, date_taken')
    .eq('user_id', userId);

  if (error) {
    logger.error('fetchStudentQuizRows failed', error, { userId });
    throw error;
  }

  const rows: DashboardQuizRow[] = [];

  for (const quizId of quizIds) {
    const quiz = data?.find((item) => item.quiz_id === quizId);
    rows.push(
      quiz
        ? {
            ...quiz,
            score: quiz.score ?? undefined,
            total_items: quiz.total_items ?? undefined,
            date_taken: quiz.date_taken ?? undefined,
          }
        : {
            quiz_id: quizId,
            status: 'Incomplete',
            score: undefined,
            total_items: undefined,
            date_taken: undefined,
          },
    );
  }

  return rows;
}

export async function fetchStudentClassCode(
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('student_class_code')
    .select('class_code')
    .eq('uuid', userId)
    .maybeSingle();

  if (error) {
    logger.error('fetchStudentClassCode failed', error, { userId });
    throw error;
  }

  return data?.class_code ?? null;
}

export async function fetchStudentPftStatus(
  userId: string,
): Promise<StudentPftStatus> {
  const { data, error } = await supabase
    .from('physical_fitness_test')
    .select('pre_physical_fitness_test, post_physical_fitness_test')
    .eq('uuid', userId)
    .maybeSingle();

  if (error) {
    logger.error('fetchStudentPftStatus failed', error, { userId });
    throw error;
  }

  return {
    preFinished: isFinishedTestIndexes(data?.pre_physical_fitness_test?.finishedTestIndex),
    postFinished: isFinishedTestIndexes(data?.post_physical_fitness_test?.finishedTestIndex),
  };
}

export async function fetchTeacherClassCodes(
  teacherId: string,
): Promise<ClassCode[]> {
  const { data, error } = await supabase
    .from('teacher_class_code')
    .select('class_code, class_name, class_color')
    .eq('uuid', teacherId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    class_code: row.class_code ?? '',
    class_name: row.class_name ?? '',
    class_color: row.class_color ?? '',
  }));
}

export async function fetchTeacherClassOwnership(
  teacherId: string,
  classCode: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('teacher_class_code')
    .select('class_code')
    .eq('uuid', teacherId)
    .eq('class_code', classCode)
    .maybeSingle();

  if (error) {
    logger.error('fetchTeacherClassOwnership failed', error, { teacherId, classCode });
    throw error;
  }

  return !error && !!data;
}

export async function fetchQuizNumbers(): Promise<number[]> {
  const { data, error } = await supabase.from('quiz').select('quiz_number');

  if (error) {
    logger.error('fetchQuizNumbers failed', error);
    throw error;
  }

  return (data ?? [])
    .map((item) => item.quiz_number)
    .filter((quizNumber): quizNumber is number => quizNumber !== null);
}
