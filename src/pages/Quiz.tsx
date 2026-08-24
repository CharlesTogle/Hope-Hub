import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeading from '@/components/PageHeading';
import AudioPlayer from '@/components/quiz/AudioPlayer';
import QuizGame from '@/components/quiz/quiz-game';
import audioFile from '@/assets/sounds/quizziz-in-game-theme.mp3';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import {
  fetchQuizQuestions,
  fetchQuizStateIfExists,
  QuizAccessError,
} from '@/queries/quiz-queries';
import { useQuery } from '@tanstack/react-query';
import { extractQuizState } from '@/lib/quiz-state';
import { quizKeys } from '@/lib/query-keys';
import { useQuizStore } from '@/store/quiz-store';
import { logger } from '@/utilities/logger';
import { useAuthStore } from '@/store/auth-store';
import type { QuizState, QuizQuestion } from '@/types/quiz';

export default function Quiz() {
  return (
    <div>
      <PageHeading text="Quizzes" className="bg-background z-2"></PageHeading>
      <QuizPage />
    </div>
  );
}

function TeacherQuizView({ quizId }: { quizId?: string }) {
  const { data: questions, isLoading, isError } = useQuery({
    queryKey: quizKeys.detail(quizId ?? ''),
    queryFn: () => fetchQuizQuestions(quizId!),
    enabled: !!quizId,
    staleTime: 1000 * 60 * 5,
  });

  if (!quizId || isLoading) {
    return <Loading />;
  }

  if (isError || !questions) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-4 text-center">
        <p className="text-red text-lg font-semibold">Failed to load quiz questions.</p>
        <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[70%] flex flex-col items-center justify-center text-black font-content mx-auto mb-8">
      <div className="self-baseline my-5 ml-8">
        <h2 className="font-heading-small text-2xl lg:text-3xl text-primary-blue">
          Quiz Preview - All Questions & Answers
        </h2>
        <hr className="w-[60%] border-1 border-primary-yellow mt-2 mb-3" />
      </div>
      {questions.map((question, index) => (
        <QuestionCard key={index} question={question} index={index} />
      ))}
    </div>
  );
}

function QuestionCard({
  question,
  index,
}: {
  question: QuizQuestion;
  index: number;
}) {
  return (
    <div className="rounded-xl border-2 border-primary-blue py-5 px-8 my-2 lg:my-4 w-[90%] text-sm lg:text-base">
      <p className="whitespace-pre-line font-semibold">
        {index + 1}. {question.question}
      </p>
      <hr className="border-1 border-black/30 my-3" />
      {question.type !== 'multiple-choice' ? (
        <div className="my-1">
          <p>
            <span className="font-semibold text-green">Answer: </span>
            {question.answer}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-baseline gap-y-2 my-3">
          {(question.choices ?? []).map((choice) => (
            <div key={choice.text} className="flex items-center gap-x-2">
              <div
                className={`w-[15px] h-[15px] rounded-full shrink-0 ${
                  choice.isCorrect ? 'bg-green' : 'bg-[#D9D9D9]'
                }`}
              />
              <p
                className={
                  choice.isCorrect ? 'font-semibold text-green' : ''
                }
              >
                {choice.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const profile = useAuthStore((state) => state.profile);
  const authLoading = useAuthStore((state) => state.isLoading);

  if (authLoading) return <Loading />;

  const userType = profile?.user_type;

  if (userType === 'teacher') {
    return <TeacherQuizView quizId={quizId} />;
  }

  return <StudentQuizView quizId={quizId} />;
}

function StudentQuizView({ quizId }: { quizId?: string }) {
  const navigate = useNavigate();
  const questions = useQuizStore((state) => state.questions);
  const quizState = useQuizStore((state) => state.quizState);
  const initializeQuiz = useQuizStore((state) => state.initializeQuiz);
  const resetQuizStore = useQuizStore((state) => state.reset);

  const { data: quizData, isLoading: isQuizLoading, isError, error } = useQuery({
    queryKey: quizKeys.detail(quizId ?? ''),
    queryFn: async () => {
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      const loadedQuestions = await fetchQuizQuestions(quizId);
      const rawState = await fetchQuizStateIfExists(quizId);
      let extractedState;
      try {
        extractedState = await extractQuizState(quizId, rawState);
      } catch (error) {
        logger.error('Failed to extract quiz state', error);
        extractedState = null;
      }
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

  if (isError) {
    if (error instanceof QuizAccessError) {
      return (
        <ErrorMessage
          title="Quiz locked"
          description={error.message}
          onBack={() => navigate(`/lectures/lecture/${error.lectureKey}`)}
          backLabel="Go to lecture"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-4 text-center">
        <p className="text-red text-lg font-semibold">Failed to load quiz.</p>
        <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

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
