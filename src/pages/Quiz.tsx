import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import AudioPlayer from '@/components/quiz/AudioPlayer';
import QuizGame from '@/components/quiz/quiz-game';
import audioFile from '@/assets/sounds/quizziz-in-game-theme.mp3';
import Loading from '@/components/Loading';
import {
  fetchQuizQuestions,
  fetchQuizStateIfExists,
} from '@/queries/quiz-queries';
import { useQuery } from '@tanstack/react-query';
import { extractQuizState } from '@/lib/quiz-state';
import { quizKeys } from '@/lib/query-keys';
import { useQuizStore } from '@/store/quiz-store';
import type { QuizState } from '@/types/quiz';

export default function Quiz() {
  return (
    <div>
      <PageHeading text="Quizzes" className="bg-background z-2"></PageHeading>
      <QuizPage />
    </div>
  );
}

export function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const questions = useQuizStore((state) => state.questions);
  const quizState = useQuizStore((state) => state.quizState);
  const initializeQuiz = useQuizStore((state) => state.initializeQuiz);
  const resetQuizStore = useQuizStore((state) => state.reset);
  const { data: quizData, isLoading: isQuizLoading } = useQuery({
    queryKey: quizKeys.detail(quizId ?? ''),
    queryFn: async () => {
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      const loadedQuestions = await fetchQuizQuestions(quizId);
      const rawState = await fetchQuizStateIfExists(quizId);
      const extractedState = await extractQuizState(quizId, rawState);
      const initialQuizState: QuizState = extractedState ?? {
        quizId,
        questionIndex: 0,
        score: 0,
        points: 0,
        currentQuestionPoints: 0,
        status: 'Pending',
        remainingTime: loadedQuestions[0]?.duration ?? 30,
        questionsAnswered: [],
      };

      return {
        questions: loadedQuestions,
        quizState:
          initialQuizState.remainingTime === 0
            ? {
                ...initialQuizState,
                remainingTime: loadedQuestions[0]?.duration ?? 30,
              }
            : initialQuizState,
      };
    },
    enabled: !!quizId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!quizData) {
      return;
    }

    initializeQuiz(quizData.questions, quizData.quizState);
  }, [initializeQuiz, quizData]);

  useEffect(() => resetQuizStore, [resetQuizStore]);

  if (!quizId || isQuizLoading || !quizState) {
    return <Loading />;
  }

  return (
    <div>
      <AudioPlayer source={audioFile} shouldStop={quizState.status === 'Done'}>
        <QuizGame quizId={quizId} questions={questions} quizState={quizState} />
      </AudioPlayer>
    </div>
  );
}
