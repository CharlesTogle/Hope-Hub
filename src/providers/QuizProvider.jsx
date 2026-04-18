import { useRef, useState, useEffect } from 'react';
import {
  extractQuizState,
  fetchQuizQuestions,
  fetchQuizStateIfExists,
} from '@/utilities/QuizData';
import { useParams } from 'react-router-dom';
import {
  QuestionsContext,
  IdentificationRefContext,
  RemainingTimeContext,
  QuizContext,
} from '@/providers/QuizContext';
import Loading from '@/components/Loading';

export default function QuizProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [quizState, setQuizState] = useState(null);

  const identificationAnswerRef = useRef('');
  const remainingTimeRef = useRef(0);

  const { quizId } = useParams();

  useEffect(() => {
    async function fetchAndSetQuizQuestions(quizId) {
      const questions = await fetchQuizQuestions(quizId);

      const extractedQuizState = await extractQuizState(
        quizId,
        await fetchQuizStateIfExists(quizId),
      );

      if (extractedQuizState.remainingTime === 0)
        extractedQuizState.remainingTime = questions[0].duration;

      setQuizState(extractedQuizState);
      setQuestions(questions);
      setIsLoading(false);
    }

    fetchAndSetQuizQuestions(quizId);
  }, [quizId]);

  return (
    <QuizContext.Provider value={{ quizState, setQuizState }}>
      <QuestionsContext.Provider value={questions}>
        <RemainingTimeContext.Provider value={remainingTimeRef}>
          <IdentificationRefContext.Provider value={identificationAnswerRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-[70vh]">
                <Loading />
              </div>
            ) : (
              children
            )}
          </IdentificationRefContext.Provider>
        </RemainingTimeContext.Provider>
      </QuestionsContext.Provider>
    </QuizContext.Provider>
  );
}
