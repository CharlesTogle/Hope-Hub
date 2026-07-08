import supabase from '@/client/supabase';
import { shuffleArray } from '@/utilities/utils';
import type {
  LeaderboardEntry,
  QuizProgressRow,
  QuizQuestion,
  QuizQuestionSet,
  QuizRow,
  QuizWithProgress,
} from '@/types/quiz';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/utilities/logger';

export async function getCurrentUser(): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export async function fetchQuizzesDefault(): Promise<QuizRow[]> {
  const { data, error } = await supabase
    .from('quiz')
    .select('id, title, lecture_title, description, questions, quiz_number')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuizRow[];
}

export async function fetchQuizzesOfUser(user: User): Promise<QuizWithProgress[]> {
  let { data: pftData } = await supabase
    .from('physical_fitness_test')
    .select('*')
    .eq('uuid', user.id)
    .single();

  if (
    pftData?.pre_physical_fitness_test &&
    pftData?.post_physical_fitness_test &&
    !pftData.post_physical_fitness_test.finishedTestIndex.includes(-1) &&
    !pftData.pre_physical_fitness_test.finishedTestIndex.includes(-1)
  ) {
    await supabase
      .from('quiz_progress')
      .upsert(
        { user_id: user.id, quiz_id: 0, status: 'Pending' as const },
        { onConflict: 'user_id, quiz_id', ignoreDuplicates: true },
      );
  }

  const { data, error } = await supabase
    .from('quiz')
    .select(`
      id, title, lecture_title, description, questions, quiz_number,
      quiz_progress!left (id, status, score, total_items, date_taken, start_time, end_time)
    `)
    .order('id', { ascending: true })
    .eq('quiz_progress.user_id', user.id);

  if (error) throw error;
  return (data ?? []) as QuizWithProgress[];
}

export async function fetchQuizzes(): Promise<QuizWithProgress[]> {
  const user = await getCurrentUser();
  const { data: userData } = await supabase
    .from('profile')
    .select('user_type')
    .eq('uuid', user.id)
    .single();
  const userType = userData?.user_type ?? 'student';
  return userType === 'student' ? fetchQuizzesOfUser(user) : fetchQuizzesDefault();
}

export async function getQuestionsFromQuiz(quizId: number | string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz')
    .select('questions')
    .eq('id', quizId)
    .single();
  if (error) throw error;
  const quiz = data as { questions: QuizQuestionSet };
  return quiz.questions.questions;
}

export async function getQuestionsFromQuizProgressIfExists(quizId: number | string): Promise<QuizQuestion[] | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('questions_shuffled')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .single();
  if (error) {
    logger.error('getQuestionsFromQuizProgressIfExists failed', error, { quizId });
    return null;
  }
  return (data as Pick<QuizProgressRow, 'questions_shuffled'>)?.questions_shuffled ?? null;
}

function shuffleQuizQuestionsAndChoices(questions: QuizQuestion[]): QuizQuestion[] {
  return shuffleArray(questions).map((question) => {
    if (question.type === 'identification') return question;
    return { ...question, choices: shuffleArray(question.choices ?? []) };
  });
}

export async function fetchQuizQuestions(quizId: number | string): Promise<QuizQuestion[]> {
  const user = await getCurrentUser();
  let questions = await getQuestionsFromQuizProgressIfExists(quizId);

  const { data: userData } = await supabase
    .from('profile')
    .select('user_type')
    .eq('uuid', user.id)
    .single();
  const userType = userData?.user_type ?? 'student';

  if (!questions) {
    questions = shuffleQuizQuestionsAndChoices(await getQuestionsFromQuiz(quizId));
    if (userType === 'student') {
      await supabase
        .from('quiz_progress')
        .update({
          start_time: new Date().toISOString(),
          questions_shuffled: questions,
        })
        .eq('user_id', user.id)
        .eq('quiz_id', quizId);
    }
  }

  return questions;
}

export async function fetchQuizStateIfExists(quizId: number | string): Promise<QuizProgressRow | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('user_id, quiz_id, question_index, score, points, status, remaining_time, questions_answered, start_time, total_items')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .single();
  if (error) {
    logger.error('fetchQuizStateIfExists failed', error, { quizId });
    return null;
  }
  return data as QuizProgressRow;
}

export async function getUserRanking(quizId: number | string): Promise<number | undefined> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('user_id, score')
    .eq('quiz_id', quizId)
    .eq('status', 'Done')
    .order('points', { ascending: false });
  if (error) throw error;
  return data
    ?.map((item, index) => ({ user_id: item.user_id, rank: index + 1 }))
    .find((item) => item.user_id === user.id)?.rank;
}

export async function getUserRankings(quizIds: (number | string)[]): Promise<Map<number | string, string>> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('quiz_id, user_id, points')
    .in('quiz_id', quizIds)
    .eq('status', 'Done')
    .order('points', { ascending: false });
  if (error) throw error;

  const byQuiz = new Map<number | string, Array<{ user_id: string }>>();
  for (const row of (data ?? [])) {
    const list = byQuiz.get(row.quiz_id) ?? [];
    list.push(row);
    byQuiz.set(row.quiz_id, list);
  }

  const result = new Map<number | string, string>();
  for (const [quizId, rows] of byQuiz) {
    const userIndex = rows.findIndex((r) => r.user_id === user.id);
    if (userIndex !== -1) result.set(quizId, String(userIndex + 1));
  }
  return result;
}

export async function fetchLeaderboard(
  quizId: number | string,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('id, user_id, points, profile(full_name)')
    .eq('quiz_id', quizId)
    .eq('status', 'Done')
    .order('points', { ascending: false })
    .limit(5);
  if (error || !data) {
    if (error) logger.error('fetchLeaderboard failed', error, { quizId });
    return [];
  }
  const currentUser = await getCurrentUser();
  const leaderboardRows = data as Array<{
    user_id: string;
    points: number | null;
    profile: Array<{ full_name: string | null }> | null;
  }>;
  return leaderboardRows.map((user, index) => ({
    rank: index + 1,
    name: user.profile?.[0]?.full_name ?? '',
    points: (user.points ?? 0).toLocaleString(),
    isCurrentUser: user.user_id === currentUser.id,
  }));
}
