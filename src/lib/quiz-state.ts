import supabase from '@/client/supabase';
import type { QuizState } from '@/types/quiz';
import type { QuizProgressRow } from '@/types/quiz';
import { getCurrentUser } from '@/queries/quiz-queries';
import { getUserRanking } from '@/queries/quiz-queries';

export async function extractQuizState(
  quizId: number | string,
  quizState: QuizProgressRow | null,
): Promise<QuizState | null> {
  const user = await getCurrentUser();
  const { data: userData } = await supabase
    .from('profile')
    .select('user_type')
    .eq('uuid', user.id)
    .single();
  const userType = userData?.user_type ?? 'student';

  if (!quizState && userType === 'student') return null;

  if (userType === 'teacher') {
    return {
      quizId,
      questionIndex: 0,
      score: 0,
      points: 0,
      currentQuestionPoints: 0,
      status: 'Pending',
      remainingTime: 0,
      questionsAnswered: [],
    };
  }

  return {
    quizId: quizState!.quiz_id,
    questionIndex: quizState!.question_index || 0,
    score: quizState!.score || 0,
    points: quizState!.points || 0,
    currentQuestionPoints: 0,
    status: quizState!.status || 'Pending',
    remainingTime: quizState!.remaining_time || 0,
    questionsAnswered: quizState!.questions_answered || [],
  };
}

export async function extractQuizDetails(quizData: unknown[]): Promise<unknown[]> {
  const user = await getCurrentUser();
  const { data: userData } = await supabase
    .from('profile')
    .select('user_type')
    .eq('uuid', user.id)
    .single();
  const userType = userData?.user_type ?? 'student';

  if (!Array.isArray(quizData) || quizData.length === 0) return quizData;

  for (const quiz of quizData as Record<string, unknown>[]) {
    const progress = (Array.isArray(quiz.quiz_progress) ? quiz.quiz_progress[0] : null) ?? {};
    quiz.number = quiz.id;
    quiz.status = userType === 'student' ? (progress as Record<string, unknown>)?.status ?? 'Locked' : 'Pending';
    quiz.details = !(progress as Record<string, unknown>).date_taken
      ? {}
      : {
          Score: `${(progress as Record<string, unknown>).score}/${(progress as Record<string, unknown>).total_items}`,
          Ranking: await getUserRanking(quiz.id as number),
          'Date Taken': new Date((progress as Record<string, unknown>).date_taken as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          'Start-time': new Date((progress as Record<string, unknown>).start_time as string).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          'End-time': new Date((progress as Record<string, unknown>).end_time as string).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        };
    quiz.content = quiz.description;
  }

  return quizData;
}
