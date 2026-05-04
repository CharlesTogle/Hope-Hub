import { useEffect, useRef, useState } from 'react';
import Timer from '@/components/quiz/Timer';
import Loading from '@/components/Loading';
import QuizBody from '@/components/quiz/quiz-body';
import QuizResults from '@/components/quiz/quiz-results';
import { calculatePoints } from '@/utilities/utils';
import { submitAnswer, markQuizAsDone } from '@/mutations/quiz-mutations';
import { fetchLeaderboard } from '@/queries/quiz-queries';
import { useQuery } from '@tanstack/react-query';
import { quizKeys } from '@/lib/query-keys';
import { useQuizStore } from '@/store/quiz-store';
import type {
  LeaderboardEntry,
  QuizChoice,
  QuizQuestion,
  QuizState,
} from '@/types/quiz';

interface QuizGameProps {
  quizId: string;
  questions: QuizQuestion[];
  quizState: QuizState;
}

export default function QuizGame({
  quizId,
  questions,
  quizState,
}: QuizGameProps) {
  const identificationAnswer = useQuizStore((state) => state.identificationAnswer);
  const remainingTime = useQuizStore((state) => state.remainingTime);
  const setQuizState = useQuizStore((state) => state.setQuizState);
  const setIdentificationAnswer = useQuizStore((state) => state.setIdentificationAnswer);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [shouldShowPoints, setShouldShowPoints] = useState(false);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[quizState.questionIndex];

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: quizKeys.leaderboard(quizId),
    queryFn: () => fetchLeaderboard(quizId),
    enabled: quizState.status === 'Done',
    staleTime: 0,
  });

  if (!currentQuestion) {
    return <Loading />;
  }

  useEffect(() => {
    return () => clearTimeout(answerTimeoutRef.current ?? undefined);
  }, []);

  function handleAnswerSelected(
    answer: QuizChoice | string,
    multipleChoice = true,
  ) {
    if (isLoading || isAnswerLocked) {
      return;
    }

    let correctAnswer = currentQuestion.answer;
    let isCorrect = false;
    let answerText = typeof answer === 'string' ? answer : answer.text;

    if (multipleChoice) {
      if (typeof answer === 'string') {
        return;
      }

      const correctChoice = currentQuestion.choices?.find((choice) => choice.isCorrect);
      if (!correctChoice) {
        return;
      }

      correctAnswer = correctChoice.text;
      isCorrect = answer.isCorrect;
      answerText = answer.text;
    } else if (
      answerText.trim().toLowerCase() === currentQuestion.answer.toLowerCase()
    ) {
      isCorrect = true;
    }

    const pointsEarnedForCurrentQuestion = calculatePoints(
      isCorrect,
      remainingTime,
      currentQuestion.duration,
    );

    setQuizState({
      ...quizState,
      currentQuestionPoints: pointsEarnedForCurrentQuestion,
    });
    setIsAnswerLocked(true);
    setShouldShowPoints(true);

    const nextQuestionIndex = quizState.questionIndex + 1;
    const nextQuestionDuration =
      questions[nextQuestionIndex]?.duration ??
      questions[0]?.duration ??
      currentQuestion.duration;

    let nextQuizState: QuizState = {
      ...quizState,
      questionIndex: nextQuestionIndex,
      score: quizState.score + (isCorrect ? 1 : 0),
      points: quizState.points + pointsEarnedForCurrentQuestion,
      remainingTime: nextQuestionDuration,
      questionsAnswered: [
        ...quizState.questionsAnswered,
        {
          question: currentQuestion.question,
          correctAnswer,
          answer: answerText,
          isCorrect,
        },
      ],
    };

    answerTimeoutRef.current = setTimeout(async () => {
      setShouldShowPoints(false);
      setIsLoading(true);
      let error = await submitAnswer(nextQuizState);

      if (nextQuizState.questionIndex === questions.length) {
        nextQuizState = {
          ...nextQuizState,
          questionIndex: nextQuizState.questionIndex - 1,
          status: 'Done',
        };

        error = await markQuizAsDone(nextQuizState);
      }

      if (!error) {
        setQuizState(nextQuizState);
      }

      setIsLoading(false);
      setIsAnswerLocked(false);
    }, 1000);
  }

  const isIdentification = currentQuestion.type === 'identification';

  return isLoading ? (
    <div className="flex justify-center items-center h-[60vh] p-4">
      <Loading />
    </div>
  ) : (
    <div id="quiz" className="flex flex-col w-[95%] lg:w-5/6 mx-auto mb-4 relative">
      <div className="flex items-start justify-between pt-8">
        <div>
          <h2 className="font-heading-small text-2xl lg:text-3xl text-primary-blue ">
            {quizState.status === 'Pending'
              ? quizId === '0'
                ? 'Quiz PFT'
                : `Quiz #${quizId}: Lecture #${quizId}`
              : 'Results & Summary'}
          </h2>
          <hr className="w-[60%] border-1 border-primary-yellow mt-2 mb-3" />
        </div>
        {quizState.status === 'Pending' && (
          <Timer
            key={quizState.questionIndex}
            duration={shouldShowPoints ? remainingTime : quizState.remainingTime}
            color="red"
            onTimerEnd={() => {
              handleAnswerSelected(
                isIdentification ? identificationAnswer : '',
                isIdentification ? false : true,
              );
              setIdentificationAnswer('');
            }}
          />
        )}
      </div>
      {quizState.status === 'Pending' ? (
        <QuizBody
          key={quizState.questionIndex}
          index={quizState.questionIndex}
          question={currentQuestion}
          score={quizState.score}
          handleAnswer={handleAnswerSelected}
          isAnswerLocked={isAnswerLocked}
          totalItems={questions.length}
          showPoints={shouldShowPoints}
          points={quizState.currentQuestionPoints}
        />
      ) : (
        <QuizResults
          questions={questions}
          quizState={quizState}
          leaderboard={leaderboard}
        />
      )}
    </div>
  );
}
