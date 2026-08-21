import type { QuizQuestion } from '@/types/quiz';

export const COMPUTATION_QUESTION_DURATION = 5 * 60;

export function getQuizQuestionDuration(
  question: Pick<QuizQuestion, 'type' | 'duration'>,
): number {
  return question.type === 'computation'
    ? COMPUTATION_QUESTION_DURATION
    : question.duration;
}
