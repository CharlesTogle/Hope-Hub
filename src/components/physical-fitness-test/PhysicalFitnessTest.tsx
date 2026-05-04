import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhysicalFitnessTestList } from '@/utilities/PhysicalFitnessTestList';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import setDataToStorage from '@/utilities/setDataToStorage';
import getDataFromStorage from '@/utilities/getDataFromStorage';
import SimpleTimer from '@/components/utilities/SimpleTimer';
import ResultSection from './ResultSection';
import TipsAndInterpretation from './TipsAndInterpretation';
import supabase from '@/client/supabase';
import { useMobile } from '@/hooks/useMobile';
import { useAuthStore } from '@/store/auth-store';
import { usePhysicalFitnessStore } from '@/store/physical-fitness-store';
import type {
  ClassificationEntry,
  PFTClassification,
  PFTColumnName,
  PFTSessionData,
  PFTTestDefinition,
} from '@/types/physical-fitness';
import type { UserType } from '@/types/auth';

interface PhysicalFitnessTestProps {
  index: string;
  setIsTimeout: (value: boolean) => void;
  physicalFitnessData: PFTSessionData;
  testType: PFTColumnName;
  userType: UserType;
}

interface TestResultsState {
  reps: string;
  timeStarted: string;
  timeEnded: string;
  classification: string;
}

interface InstructionsGroupProps {
  text: string;
  items: string[];
  id: string;
}

function formatCurrentTime(): string {
  return `${String(new Date().getHours()).padStart(2, '0')}:${String(
    new Date().getMinutes(),
  ).padStart(2, '0')}`;
}

function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function getClassificationEntries(
  classification: PFTClassification | undefined,
  category: PFTSessionData['category'],
): ClassificationEntry[] | undefined {
  if (!classification) {
    return undefined;
  }

  if (Array.isArray(classification)) {
    return classification;
  }

  if (!category) {
    return undefined;
  }

  return classification[category];
}

const InstructionsGroup = memo(function InstructionsGroup({
  text,
  items,
  id,
}: InstructionsGroupProps) {
  return (
    <div id={id}>
      <h3 className="text-base font-semibold">{text}</h3>
      <ol className="list-decimal ml-6">
        {items.map((item, index) => {
          const segments = item.split(/(\*\*[^*]+\*\*)/g);

          return (
            <li key={`${text}-${index}`}>
              {segments.map((segment, segmentIndex) =>
                segment.startsWith('**') && segment.endsWith('**') ? (
                  <strong key={`${segment}-${segmentIndex}`}>
                    {segment.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={`${segment}-${segmentIndex}`}>{segment}</span>
                ),
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
});

export default function PhysicalFitnessTest({
  index,
  setIsTimeout,
  physicalFitnessData,
  testType,
  userType,
}: PhysicalFitnessTestProps) {
  const [currentTime, setCurrentTime] = useState(formatCurrentTime());
  const [category, setCategory] = useState<PFTSessionData['category']>('');
  const [testResults, setTestResults] = useState<TestResultsState>({
    reps: '',
    timeStarted: formatCurrentTime(),
    timeEnded: '',
    classification: 'No data available',
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [timerTime, setTimerTime] = useState(1200);

  const { setSessionData } = usePhysicalFitnessStore();
  const userId = useAuthStore((state) => state.profile?.uuid ?? null);
  const navigate = useNavigate();
  const isTeacher = userType === 'teacher';
  const isMobile = useMobile();
  const testIndex = Number(index);
  const testDetails = PhysicalFitnessTestList[testIndex];

  const scrollToTop = useCallback(() => {
    if (isMobile) {
      window.dispatchEvent(new Event('scrollPFTContainerToTop'));
    }
  }, [isMobile]);

  useEffect(() => {
    const storedData = getDataFromStorage<PFTSessionData>('physicalFitnessData');
    setCategory(storedData?.category ?? '');
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        'Are you sure you want to leave? Your test progress will be lost.';
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const setClassification = useCallback((value: string) => {
    setTestResults((previous) => ({
      ...previous,
      classification: value,
    }));
  }, []);

  const handleInterpretation = useCallback(
    (updatedTestResults: TestResultsState) => {
      const reps = Number.parseFloat(updatedTestResults.reps);
      const storedData = getDataFromStorage<PFTSessionData>('physicalFitnessData');
      const storedCategory = storedData?.category ?? '';
      const activeCategory = storedCategory || category;
      const entries = getClassificationEntries(
        testDetails?.classification,
        activeCategory,
      );

      setCategory(activeCategory);

      if (!entries || Number.isNaN(reps)) {
        setClassification('No information available');
        return;
      }

      const matchingEntry = entries.find((item) => {
        if (item.exact !== undefined) {
          return reps === item.exact;
        }

        if (item.min !== undefined && item.max !== undefined) {
          return item.min <= reps && item.max >= reps;
        }

        if (item.min !== undefined && item.max === undefined) {
          return item.min <= reps;
        }

        return false;
      });

      setClassification(matchingEntry?.interpretation ?? 'No information available');
    },
    [category, setClassification, testDetails],
  );

  const handleResultChange = useCallback(
    (type: 'Record' | 'Time Started' | 'Time End', value: string | number) => {
      const keyMap = {
        Record: 'reps',
        'Time Started': 'timeStarted',
        'Time End': 'timeEnded',
      } satisfies Record<'Record' | 'Time Started' | 'Time End', keyof TestResultsState>;
      const key = keyMap[type];

      setTestResults((previous) => {
        const updatedTestResults: TestResultsState = {
          ...previous,
          [key]: String(value),
        };

        if (key === 'reps') {
          handleInterpretation(updatedTestResults);
        }

        return updatedTestResults;
      });
    },
    [handleInterpretation],
  );

  const persistSession = useCallback(
    async (updatedData: PFTSessionData) => {
      if (!userId) {
        return;
      }

      setSessionData(updatedData);
      setDataToStorage('physicalFitnessData', updatedData);

      await supabase
        .from('physical_fitness_test')
        .update({ [testType]: updatedData })
        .eq('uuid', userId);
    },
    [setSessionData, testType, userId],
  );

  const resetForNextStep = useCallback(
    (timeValue: string) => {
      scrollToTop();
      navigate(`/physical-fitness-test/test/${testIndex + 1}`);
      setTimerTime(1200);
      setTestResults({
        reps: '',
        timeStarted: timeValue,
        timeEnded: '',
        classification: 'No data available',
      });
    },
    [navigate, scrollToTop, testIndex],
  );

  const handleBackForTeacher = useCallback(() => {
    if (userType === 'teacher' && testIndex !== 0) {
      scrollToTop();
      navigate(`/physical-fitness-test/test/${testIndex - 1}`);
    }
  }, [navigate, scrollToTop, testIndex, userType]);

  const handleSubmit = useCallback(async () => {
    if (!userId || !testDetails) {
      return;
    }

    const nowTime = formatCurrentTime();
    setCurrentTime(nowTime);

    const hasEmptyField = Object.values(testResults).some(
      (value) => value.trim() === '',
    );

    if (hasEmptyField) {
      setAlertMessage('Please fill out all fields before submitting');
      setShowAlert(true);
      return;
    }

    const startTimeInMinutes = parseTime(testResults.timeStarted);
    const endTimeInMinutes = parseTime(testResults.timeEnded);
    const currentTimeInMinutes = parseTime(nowTime);
    const isStartTimeAfterEndTime = testResults.timeStarted > testResults.timeEnded;
    const isEndTimeAfterCurrentTime = endTimeInMinutes > currentTimeInMinutes;
    const isTimeThresholdReached = endTimeInMinutes - startTimeInMinutes <= 2;
    const isTimeEndValid = endTimeInMinutes - startTimeInMinutes > 20;

    if (isStartTimeAfterEndTime || isEndTimeAfterCurrentTime) {
      setAlertMessage("Please input a valid time for 'Time End'");
      setShowAlert(true);
      return;
    }

    if (
      isTimeThresholdReached &&
      testDetails.title !== 'BMI (Weight)' &&
      testDetails.title !== 'BMI (Height)'
    ) {
      setAlertMessage(
        'Test duration is too short. The test must last more than 2 minutes for accurate results.',
      );
      setShowAlert(true);
      return;
    }

    if (isTimeEndValid) {
      setAlertMessage(
        'Test duration is too long. The test should not exceed 20 minutes. Please check your time entries.',
      );
      setShowAlert(true);
      return;
    }

    const updatedFinishedTestIndex = [...physicalFitnessData.finishedTestIndex];
    updatedFinishedTestIndex[testIndex] = testIndex;

    const updatedPhysicalFitnessData: PFTSessionData = {
      ...physicalFitnessData,
      [testDetails.key]: {
        title: testDetails.title,
        record: testResults.reps,
        timeStarted: testResults.timeStarted,
        timeEnd: testResults.timeEnded,
        classification: testResults.classification,
      },
      finishedTestIndex: updatedFinishedTestIndex,
    };

    await persistSession(updatedPhysicalFitnessData);

    if (physicalFitnessData.finishedTestIndex.length >= testIndex) {
      resetForNextStep(nowTime);
    }
  }, [
    persistSession,
    physicalFitnessData,
    resetForNextStep,
    testDetails,
    testIndex,
    testResults,
    userId,
  ]);

  const handleNextExerciseTeacher = useCallback(async () => {
    if (!testDetails || !userId) {
      return;
    }

    const nowTime = formatCurrentTime();
    setCurrentTime(nowTime);

    const updatedFinishedTestIndex = [...physicalFitnessData.finishedTestIndex];
    updatedFinishedTestIndex[testIndex] = testIndex;

    const updatedPhysicalFitnessData: PFTSessionData = {
      ...physicalFitnessData,
      [testDetails.key]: {
        title: testDetails.title,
        record: testResults.reps,
        timeStarted: nowTime,
        timeEnd: '',
        classification: 'No data available',
      },
      finishedTestIndex: updatedFinishedTestIndex,
    };

    await persistSession(updatedPhysicalFitnessData);

    if (physicalFitnessData.finishedTestIndex.length >= testIndex) {
      resetForNextStep(nowTime);
    }
  }, [
    persistSession,
    physicalFitnessData,
    resetForNextStep,
    testDetails,
    testIndex,
    testResults.reps,
    userId,
  ]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        void handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmit]);

  if (!testDetails) {
    return null;
  }

  const {
    title,
    description,
    equipment,
    instructionsForPartner,
    instructionsForTester,
    instructionsScoring,
    videoInstructions,
    unit,
    tips,
  }: PFTTestDefinition = testDetails;

  return (
    <div id="test-container" className="min-w-[100%] h-full">
      {showAlert && (
        <AlertMessage
          text={alertMessage}
          onCancel={() => setShowAlert(false)}
          onConfirm={() => setShowAlert(false)}
        />
      )}
      <div
        id="test-contents"
        className="w-[95%] mt-20 gap-5 mr-auto ml-auto lg:grid lg:grid-cols-[65%_35%] lg:w-[85%] lg:mt-0"
      >
        <div
          id="test-instructions"
          className="p-5 pb-10 grid grid-cols-[60%_40%] border-2 border-black row-span-2 relative font-content rounded-2xl lg:p-10"
        >
          <div
            id="name"
            className="flex w-full flex-col justify-center items-start"
          >
            <h1 id="test-name" className="text-3xl font-bold mb-3">
              {title}
            </h1>
            <hr className="w-[50%] border-1 border-black" />
          </div>
          {userType !== 'teacher' && (
            <div
              id="timer"
              className="absolute -top-20 flex pl-5 flex-row w-full justify-center gap-5 items-center lg:relative lg:top-0 lg:block lg:w-auto lg:p-0"
            >
              <p className="text-lg font-bold italic">Timeout in:</p>
              <SimpleTimer
                time={timerTime}
                className="flex flex-row justify-start items-center space-x-5 lg:relative lg:right-0 lg:w-[50%] lg:mt-2"
                onEnd={() => setIsTimeout(true)}
                testName={title}
              />
            </div>
          )}
          <iframe
            src={videoInstructions}
            className="col-span-2 mt-10 mb-5 w-full aspect-video border-1 border-black rounded-sm"
            allow="autoplay"
          />
          <div id="instructions" className="col-span-2 text-sm font-medium">
            <h2 className="text-xl font-bold">Description:</h2>
            <InstructionsGroup text="" items={description} id="description" />
            <h2 className="text-xl font-bold mt-3">Instructions:</h2>
            <InstructionsGroup text="Equipment" items={equipment} id="equipment" />
            <InstructionsGroup
              text="For the tester"
              items={instructionsForTester}
              id="for-tester"
            />
            <InstructionsGroup
              text="For the partner"
              items={instructionsForPartner}
              id="for-partner"
            />
            <InstructionsGroup
              text="Scoring"
              items={instructionsScoring}
              id="scoring"
            />
          </div>
          <hr className="absolute bottom-8 right-0 border-1 border-black w-[20%]" />
          <hr className="absolute bottom-5 left-0 border-1 border-black w-[50%]" />
        </div>
        <div
          id="results-interpretation-tips"
          className="flex flex-col space-y-5"
        >
          <ResultSection
            testName={title}
            handleResultChange={handleResultChange}
            handleSubmit={() => {
              void (isTeacher ? handleNextExerciseTeacher() : handleSubmit());
            }}
            handleBack={handleBackForTeacher}
            testResults={testResults}
            currentTime={currentTime}
            unit={unit}
            isTeacher={isTeacher}
            testNumber={testIndex}
          />
          <TipsAndInterpretation
            testName={title}
            testResults={testResults}
            tips={tips}
          />
        </div>
      </div>
    </div>
  );
}
