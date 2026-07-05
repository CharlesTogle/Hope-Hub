import supabase from '@/client/supabase';
import type { QuizState } from '@/types/quiz';
import { getCurrentUser } from '@/queries/quiz-queries';

export async function submitAnswer(quizState: QuizState): Promise<void> {
  const { quizId, questionIndex, score, points, remainingTime, questionsAnswered } = quizState;
  const user = await getCurrentUser();

  const { data: userData } = await supabase
    .from('profile')
    .select('user_type')
    .eq('uuid', user.id)
    .single();
  if (userData?.user_type !== 'student') return;

  const { error } = await supabase
    .from('quiz_progress')
    .update({
      question_index: questionIndex,
      score,
      points,
      remaining_time: Math.max(0, remainingTime),
      questions_answered: questionsAnswered,
    })
    .eq('user_id', user.id)
    .eq('quiz_id', quizId);

  if (error) throw error;
}

export async function markQuizAsDone(quizState: QuizState): Promise<void> {
  const { quizId, questionIndex, status } = quizState;
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('quiz_progress')
    .update({
      question_index: questionIndex,
      status,
      total_items: questionIndex + 1,
      date_taken: new Date().toLocaleDateString('en-CA'),
      end_time: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('quiz_id', quizId);
  if (error) throw error;
}

export async function updateRemainingTime(quizId: number | string, remainingTime: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('quiz_progress')
    .update({ remaining_time: Math.max(0, remainingTime) })
    .eq('user_id', user.id)
    .eq('quiz_id', quizId);
  if (error) throw error;
}
