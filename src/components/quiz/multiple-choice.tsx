import CustomButton from '@/components/quiz/CustomButton';
import type { QuizChoice } from '@/types/quiz';

interface MultipleChoiceProps {
  choices?: QuizChoice[];
  handleAnswer: (answer: QuizChoice) => void;
  isDisabled: boolean;
}

const colors = ['#FFB24E', '#FF3B30', '#A16BFF', '#34C759'];

export default function MultipleChoice({
  choices,
  handleAnswer,
  isDisabled,
}: MultipleChoiceProps) {
  return (
    <div className="flex flex-wrap justify-center w-full h-full mt-3">
      {(choices ?? []).map((choice, index) => (
        <CustomButton
          key={choice.text}
          disabled={isDisabled}
          onClick={() => handleAnswer(choice)}
          className="rounded-md w-full lg:w-[45%] min-h-[15vh] lg:min-h-[20vh] text-center m-3 px-6 py-6 text-balance break-words text-xl"
          style={{ backgroundColor: colors[index] }}
        >
          <span>{choice.text}</span>
        </CustomButton>
      ))}
    </div>
  );
}
