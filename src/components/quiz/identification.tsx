import { Input } from '@/components/ui/input';
import CustomButton from '@/components/quiz/CustomButton';
import { useQuizStore } from '@/store/quiz-store';

interface IdentificationProps {
  handleAnswer: (answer: string, multipleChoice?: boolean) => void;
  isDisabled: boolean;
}

export default function Identification({
  handleAnswer,
  isDisabled,
}: IdentificationProps) {
  const identificationAnswer = useQuizStore((state) => state.identificationAnswer);
  const setStoreIdentificationAnswer = useQuizStore(
    (state) => state.setIdentificationAnswer,
  );

  return (
    <div className="w-[80%] lg:w-[70%] flex flex-col gap-y-4 lg:flex-row mt-5 justify-between items-center">
      <Input
        className="rounded-sm lg:w-[80%] h-full text-left bg-white text-black !text-lg border-2 border-black py-2 px-5 lg:px-10 placeholder:text-left"
        type="text"
        placeholder="Answer"
        onChange={(event) => setStoreIdentificationAnswer(event.target.value)}
        value={identificationAnswer}
      />
      <CustomButton
        disabled={isDisabled || identificationAnswer.trim() === ''}
        onClick={() => {
          handleAnswer(identificationAnswer, false);
          setStoreIdentificationAnswer('');
        }}
        className="bg-secondary-dark-blue text-white font-content text-lg px-8 py-2"
      >
        SUBMIT
      </CustomButton>
    </div>
  );
}
