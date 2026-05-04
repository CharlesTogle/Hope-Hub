import { AnimatePresence, motion } from 'motion/react';
import QuizLeaderboard from '@/components/quiz/quiz-leaderboard';
import QuizQuestionReview from '@/components/quiz/quiz-question-review';
import type { LeaderboardEntry, QuizQuestion, QuizState } from '@/types/quiz';

interface QuizResultsProps {
  questions: QuizQuestion[];
  quizState: QuizState;
  leaderboard: LeaderboardEntry[];
}

export default function QuizResults({
  questions,
  quizState,
  leaderboard,
}: QuizResultsProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-[70%] flex flex-col items-center justify-center text-black font-content mx-auto"
      >
        <div className="rounded-2xl mt-2 lg:mt-5 mb-6 py-8 text-base border-2 border-black w-full bg-[linear-gradient(180deg,#111C4E_0%,#003D69_100%)]">
          <div className="relative w-full flex flex-col items-center justify-center border-t-2 border-white text-white">
            <div className="w-[55%] bg-[#111C4E] absolute -top-3 left-1/2 -translate-x-1/2 ">
              <h3 className="w-fit mx-auto font-semibold text-xl lg:text-2xl text-center border-b-[0.8px] border-white px-6">
                Summary
              </h3>
            </div>
            <h3 className="text-base lg:text-lg mt-9">
              Quiz #{quizState.quizId} Lecture #{quizState.quizId}
            </h3>
            <h2 className="text-xl lg:text-2xl font-semibold border-b-2 border-white px-3 pb-4 mt-4">
              You did your best!
            </h2>
            <div className="flex items-center justify-between mt-5 mb-4 w-[70%] lg:w-[55%]">
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold border-b-2 border-white px-2">
                  Score:
                </h1>
              </div>
              <div className="rounded-xl border-2 border-white py-5 w-[55%] lg:w-[70%] bg-[#000A3A] text-center">
                <motion.h1
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [1, 0.9, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-2xl lg:text-4xl font-bold"
                >
                  {quizState.score}/{quizState.questionsAnswered.length}
                </motion.h1>
              </div>
            </div>
            <hr className="w-[75%] border-1 border-white mt-3 mb-4" />
            <h3 className="text-base lg:text-lg">Performance Stats</h3>
            <div className="flex gap-3 items-center justify-between mt-3 w-[80%]">
              <div className="flex flex-col items-center justify-center text-green py-3 w-[60%] rounded-xl border-2 border-white  bg-[#000A3A]">
                <motion.h3
                  animate={{ rotate: [-3, 3, -3, 3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-xl lg:text-2xl font-bold"
                >
                  {quizState.score}
                </motion.h3>
                <motion.h3
                  animate={{ rotate: [-3, 3, -3, 3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  Correct
                </motion.h3>
              </div>
              <div className="flex flex-col items-center justify-center text-red py-3 w-[60%] rounded-xl border-2 border-white bg-[#000A3A]">
                <motion.h3
                  animate={{ rotate: [-3, 3, -3, 3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-xl lg:text-2xl font-bold"
                >
                  {quizState.questionsAnswered.length - quizState.score}
                </motion.h3>
                <motion.h3
                  animate={{ rotate: [-3, 3, -3, 3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  Incorrect
                </motion.h3>
              </div>
            </div>
            <hr className="w-[40%] border-1 border-white mt-8 mb-5" />
          </div>
          <QuizLeaderboard leaderboard={leaderboard} />
        </div>
        <div className="self-baseline my-3">
          <h4 className="font-semibold text-lg lg:text-xl">Review Questions</h4>
          <h4 className="text-base lg:text-lg">
            Here lies all the correct answers.
          </h4>
        </div>
        {quizState.questionsAnswered.map((questionData, index) => (
          <QuizQuestionReview
            key={`${index}-${questionData.question}`}
            index={index}
            questionData={questionData}
            question={questions[index]}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
