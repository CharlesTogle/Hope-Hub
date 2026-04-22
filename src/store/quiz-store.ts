import { create } from 'zustand';
import type { QuizQuestion, QuizState } from '@/types/quiz';

interface QuizStoreState {
  questions: QuizQuestion[];
  quizState: QuizState | null;
  identificationAnswer: string;
  remainingTime: number;

  setQuestions: (q: QuizQuestion[]) => void;
  setQuizState: (s: QuizState | null) => void;
  setIdentificationAnswer: (a: string) => void;
  setRemainingTime: (t: number) => void;
  reset: () => void;
}

const initialState = {
  questions: [] as QuizQuestion[],
  quizState: null as QuizState | null,
  identificationAnswer: '',
  remainingTime: 0,
};

export const useQuizStore = create<QuizStoreState>((set) => ({
  ...initialState,

  setQuestions: (questions) => set({ questions }),
  setQuizState: (quizState) => set({ quizState }),
  setIdentificationAnswer: (identificationAnswer) => set({ identificationAnswer }),
  setRemainingTime: (remainingTime) => set({ remainingTime }),
  reset: () => set(initialState),
}));
