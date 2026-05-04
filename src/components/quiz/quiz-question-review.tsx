import type { AnsweredQuestion, QuizQuestion } from '@/types/quiz';

interface QuizQuestionReviewProps {
  index: number;
  questionData: AnsweredQuestion;
  question?: QuizQuestion;
}

export default function QuizQuestionReview({
  index,
  questionData,
  question,
}: QuizQuestionReviewProps) {
  const selectedColor = questionData.isCorrect ? 'bg-green' : 'bg-red';

  return (
    <div
      className={`rounded-xl border-2 ${
        questionData.isCorrect ? 'border-green' : 'border-red'
      } py-5 px-8 my-2 lg:my-4 w-full text-sm lg:text-base`}
    >
      <p className="whitespace-pre-line">
        {index + 1}. {questionData.question}
      </p>
      <hr className="border-1 border-black/30 my-3" />
      {question?.type === 'identification' ? (
        <div className="my-1">
          <div className="flex items-center gap-x-2">
            <div
              className={`w-[15px] h-[15px] rounded-full shrink-0 ${
                questionData.answer.trim() === ''
                  ? 'bg-[#D9D9D9]'
                  : selectedColor
              }`}
            ></div>
            <h3>Your answer: {questionData.answer}</h3>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-baseline gap-y-2 my-3">
          {(question?.choices ?? []).map((choice) => (
            <div key={choice.text} className="flex items-center gap-x-2">
              <div
                className={`w-[15px] h-[15px] rounded-full shrink-0 ${
                  choice.text === questionData.answer
                    ? selectedColor
                    : 'bg-[#D9D9D9]'
                }`}
              ></div>
              <p>{choice.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
