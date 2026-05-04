import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchQuizQuestions, fetchQuizStateIfExists } from '@/queries/quiz-queries';
import { extractQuizState } from '@/lib/quiz-state';
import {
  QuestionsContext,
  IdentificationRefContext,
  RemainingTimeContext,
  QuizContext,
} from '@/providers/QuizContext';
import Loading from '@/components/Loading';
import { useQuizStore } from '@/store/quiz-store';
import { quizKeys } from '@/lib/query-keys';
import type { ReactNode } from 'react';
import type { QuizState } from '@/types/quiz';

interface QuizProviderProps {
  children: ReactNode;
}

export default function QuizProvider({ children }: QuizProviderProps) {
  const { quizId } = useParams();
  const { setQuestions, quizState, setQuizState: storeSetQuizState } = useQuizStore();

  const identificationAnswerRef = useRef('');
  const remainingTimeRef = useRef(0);

  const { isLoading, data } = useQuery({
    queryKey: quizKeys.detail(quizId ?? ''),
    queryFn: async () => {
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }
      const questions = await fetchQuizQuestions(quizId);
      const rawState = await fetchQuizStateIfExists(quizId);
      const extracted = await extractQuizState(quizId, rawState);
      const state: QuizState = extracted ?? {
        quizId,
        questionIndex: 0,
        score: 0,
        points: 0,
        currentQuestionPoints: 0,
        status: 'Pending',
        remainingTime: questions[0]?.duration ?? 30,
        questionsAnswered: [],
      };
      if (state.remainingTime === 0) state.remainingTime = questions[0]?.duration ?? 30;
      setQuestions(questions);
      storeSetQuizState(state);
      return { questions, state };
    },
    enabled: !!quizId,
    staleTime: 0,
  });

  // Derive context values: prefer store (live updates) over query snapshot
  const contextQuizState = quizState ?? data?.state ?? null;
  const contextQuestions = data?.questions ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loading />
      </div>
    );
  }

  return (
    <QuizContext.Provider value={{ quizState: contextQuizState, setQuizState: storeSetQuizState }}>
      <QuestionsContext.Provider value={contextQuestions}>
        <RemainingTimeContext.Provider value={remainingTimeRef}>
          <IdentificationRefContext.Provider value={identificationAnswerRef}>
            {children}
          </IdentificationRefContext.Provider>
        </RemainingTimeContext.Provider>
      </QuestionsContext.Provider>
    </QuizContext.Provider>
  );
}
