import QuizBackground from '@/assets/images/quiz_bg.png';
import { AnimatePresence, motion } from 'motion/react';
import Identification from '@/components/quiz/identification';
import MultipleChoice from '@/components/quiz/multiple-choice';
import type { QuizChoice, QuizQuestion } from '@/types/quiz';
import type { ReactNode } from 'react';

interface QuizBodyProps {
  index: number;
  question: QuizQuestion;
  score: number;
  handleAnswer: (answer: QuizChoice | string, multipleChoice?: boolean) => void;
  isAnswerLocked: boolean;
  totalItems: number;
  showPoints: boolean;
  points: number;
  timer?: ReactNode;
}

export default function QuizBody({
  index,
  question,
  score,
  handleAnswer,
  isAnswerLocked,
  totalItems,
  showPoints,
  points,
  timer,
}: QuizBodyProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      <div className="rounded-t-full border-2 border-secondary-dark-blue py-4 px-10 lg:px-14 relative top-3">
        <span className="font-content text-xl lg:text-2xl">Score: {score}</span>
      </div>
      <div
        className="flex flex-col justify-center items-center rounded-2xl w-full lg:min-h-[90vh] z-10 bg-cover bg-center bg-no-repeat p-3 lg:p-10 text-xl lg:text-2xl text-white font-content relative"
        style={{ backgroundImage: `url(${QuizBackground})` }}
      >
        {timer && (
          <div className="absolute top-4 right-4 z-20 rounded-full bg-white px-3 py-2 shadow-md">
            {timer}
          </div>
        )}
        <h3 className="my-5 lg:my-7 text-3xl">
          {index + 1}/{totalItems}
        </h3>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            {showPoints && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-[rgba(0,0,0,0.5)] rounded-2xl"
              >
                <motion.span
                  className="text-green-500 text-5xl lg:text-8xl font-bold drop-shadow-lg"
                  initial={{ y: -50 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  +{points} points!
                </motion.span>
              </motion.div>
            )}
            <p className="w-full lg:w-[80%] text-center whitespace-pre-line">
              {question.question}
            </p>
            <hr className="w-[85%] lg:w-[75%] border-1 border-white mt-8 mb-4" />
            {question.type !== 'multiple-choice' ? (
              <Identification
                handleAnswer={handleAnswer}
                isDisabled={isAnswerLocked}
              />
            ) : (
              <MultipleChoice
                choices={question.choices}
                handleAnswer={handleAnswer}
                isDisabled={isAnswerLocked}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
