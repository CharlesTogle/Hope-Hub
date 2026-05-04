import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { QuizQuestion, QuizState } from '@/types/quiz';

interface QuizContextValue {
  quizState: QuizState | null;
  setQuizState: (quizState: QuizState | null) => void;
}

export const QuizContext = createContext<QuizContextValue | null>(null);

export const QuestionsContext = createContext<QuizQuestion[] | null>(null);

export const IdentificationRefContext = createContext<MutableRefObject<string> | null>(null);

export const RemainingTimeContext = createContext<MutableRefObject<number> | null>(null);

export function useQuizContext(): QuizContextValue {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('Quiz context is missing');
  }
  return context;
}

export function useQuizQuestions(): QuizQuestion[] {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('Quiz questions context is missing');
  }
  return context;
}

export function useIdentificationAnswerRef(): MutableRefObject<string> {
  const context = useContext(IdentificationRefContext);
  if (!context) {
    throw new Error('Identification answer ref context is missing');
  }
  return context;
}

export function useRemainingTimeRef(): MutableRefObject<number> {
  const context = useContext(RemainingTimeContext);
  if (!context) {
    throw new Error('Remaining time ref context is missing');
  }
  return context;
}
