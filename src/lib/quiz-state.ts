import supabase from '@/client/supabase';
import type { QuizState, QuizProgressRow, QuizWithProgress } from '@/types/quiz';
import { getCurrentUser, getUserRanking } from '@/queries/quiz-queries';

function normalizeQuizRunStatus(
  status: QuizProgressRow['status'] | null | undefined,
): QuizState['status'] {
  return status === 'Done' ? 'Done' : 'Pending';
}

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
    status: normalizeQuizRunStatus(quizState!.status),
    remainingTime: quizState!.remaining_time || 0,
    questionsAnswered: quizState!.questions_answered || [],
  };
}

export async function extractQuizDetails(quizData: QuizWithProgress[]): Promise<QuizWithProgress[]> {
  const user = await getCurrentUser();
  const { data: userData } = await supabase
    .from('profile')
    .select('user_type')
    .eq('uuid', user.id)
    .single();
  const userType = userData?.user_type ?? 'student';

  if (!Array.isArray(quizData) || quizData.length === 0) return quizData;

  const rankingEntries = await Promise.all(
    quizData
      .filter((q) => (q.quiz_progress as QuizProgressRow[] | undefined)?.[0]?.date_taken)
      .map(async (q) => {
        try {
          return [q.id, String(await getUserRanking(q.id) ?? '')] as const;
        } catch {
          return [q.id, ''] as const;
        }
      }),
  );
  const rankingMap = new Map(rankingEntries);

  for (const quiz of quizData) {
    const progress: QuizProgressRow | null =
      (Array.isArray(quiz.quiz_progress) ? quiz.quiz_progress[0] : null) ?? null;

    quiz.number = quiz.id;
    quiz.status = userType === 'student' ? (progress?.status ?? 'Locked') : 'Pending';
    quiz.details = !progress?.date_taken
      ? {}
      : {
          Score: `${progress.score}/${progress.total_items}`,
          Ranking: rankingMap.get(quiz.id) ?? '',
          'Date Taken': new Date(progress.date_taken).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          'Start-time': progress.start_time
            ? new Date(progress.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : '',
          'End-time': progress.end_time
            ? new Date(progress.end_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : '',
        };
    quiz.content = quiz.description;
  }

  return quizData;
}
