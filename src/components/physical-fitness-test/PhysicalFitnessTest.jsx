import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhysicalFitnessTestList } from '@/utilities/PhysicalFitnessTestList';
import { usePhysicalFitnessData } from '@/hooks/usePhysicalFitnessData';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import setDataToStorage from '@/utilities/setDataToStorage';
import getDataFromStorage from '@/utilities/getDataFromStorage';
import SimpleTimer from '@/components/utilities/SimpleTimer';
import ResultSection from './ResultSection';
import TipsAndInterpretation from './TipsAndInterperetation';
import supabase from '@/client/supabase';
import { useUserId } from '@/hooks/useUserId';
import { memo } from 'react';
import { useCallback } from 'react';
import { useMobile } from '@/hooks/useMobile';

const parseTime = timeString => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes; // Convert to total minutes
};

const InstructionsGroup = memo(({ text, array, id }) => (
  <div id={id}>
    <h3 className='text-base font-semibold'>{text}</h3>
    <ol className='list-decimal ml-6'>
      {array.map((item, index) => {
        if (typeof item !== 'string') {
          return <li key={`${text} ${index}`}>{item}</li>;
        }
        const segments = item.split(/(\*\*[^*]+\*\*)/g);

        const content = segments.map((seg, segIndex) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={segIndex}>{seg.slice(2, -2)}</strong>;
          }
          return <span key={segIndex}>{seg}</span>;
        });

        return <li key={`${text} ${index}`}>{content}</li>;
      })}
    </ol>
  </div>
));

export default function PhysicalFitnessTest ({
  index,
  setIsTimeout,
  physicalFitnessData,
  testType,
  userType,
}) {
  const [currentTime, setCurrentTime] = useState(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(
      new Date().getMinutes(),
    ).padStart(2, '0')}`,
  );
  const [category, setCategory] = useState('');
  const [testResults, setTestResults] = useState({
    reps: '',
    timeStarted: currentTime,
    timeEnded: '',
    classification: 'No data available',
  });
  const { setPhysicalFitnessData } = usePhysicalFitnessData();
  const testDetails = PhysicalFitnessTestList[index];
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [timerTime, setTimerTime] = useState(1200);
  const navigate = useNavigate();
  const userId = useUserId();
  const isTeacher = userType === 'teacher';
  const isMobile = useMobile();

  const scrollToTop = useCallback(() => {
    if (isMobile) {
      window.dispatchEvent(new Event('scrollPFTContainerToTop'));
    }
  }, [isMobile]);

  const {
    title,
    description,
    equipment,
    instructionsForPartner,
    instructionsForTester,
    instructionsScoring,
    videoInstructions,
    unit,
  } = testDetails || {};
  const testName = title;

  useEffect(() => {
    const storedData = getDataFromStorage('physicalFitnessData');
    setCategory(storedData.category);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = e => {
      e.preventDefault();
      e.returnValue =
        'Are you sure you want to leave? Your test progress will be lost.';
      return 'Are you sure you want to leave? Your test progress will be lost.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const setClassification = useCallback(
    value => {
      setTestResults(prev => ({
        ...prev,
        classification: value,
      }));
    },
    [setTestResults],
  );

  const handleInterpretation = useCallback(
    updatedTestResults => {
      const reps = parseFloat(updatedTestResults.reps);
      const storedData = getDataFromStorage('physicalFitnessData');
      setCategory(storedData.category);
      let classificationDetails = testDetails.classification?.[category];
      if (testName === 'Push-Up') {
        classificationDetails =
          testDetails.classification?.[storedData.category];
      }
      if (!classificationDetails) {
        setCategory(prev => {
          if (!prev) {
            return storedData.category;
          }
          let data = prev.slice(-4);
          data = data === 'irls' ? 'Girls' : 'Boys';
          return data;
        });
        classificationDetails = testDetails.classification;
      }
      if (!classificationDetails) {
        setClassification('No information available');
        return;
      } else if (Array.isArray(classificationDetails)) {
        classificationDetails.forEach(item => {
          if (item.exact !== undefined && reps === item.exact) {
            setClassification(item.interpretation);
            return;
          } else if (
            item.min !== undefined &&
            item.max !== undefined &&
            item.min <= reps &&
            item.max >= reps
          ) {
            setClassification(item.interpretation);
            return;
          } else if (item.min !== undefined && !item.max && item.min <= reps) {
            setClassification(item.interpretation);
            return;
          }
        });
      }
    },
    [setClassification, setCategory, testDetails, category, testName],
  );

  const handleResultChange = useCallback(
    (type, value) => {
      let key = '';
      switch (type) {
        case 'Record':
          key = 'reps';
          break;
        case 'Time Started':
          key = 'timeStarted';
          break;
        case 'Time End':
          key = 'timeEnded';
          break;
      }

      setTestResults(prev => {
        const updatedTestResults = {
          ...prev,
          [key]: value.toString(),
        };
        if (key === 'reps') {
          handleInterpretation(updatedTestResults);
        }

        return updatedTestResults;
      });
    },
    [handleInterpretation, setTestResults],
  );

  const handleBackForTeacher = useCallback(() => {
    if (userType === 'teacher' && Number(index) !== 0) {
      scrollToTop();
      navigate(`/physical-fitness-test/test/${Number(index) - 1}`);
    }
  }, [userType, index, scrollToTop, navigate]);
  const handleSubmit = useCallback(async () => {
    if (!userId) return;
    setCurrentTime(
      `${String(new Date().getHours()).padStart(2, '0')}:${String(
        new Date().getMinutes(),
      ).padStart(2, '0')}`,
    );

    const hasEmptyField = Object.values(testResults).some(
      value => value.toString() === '' || value.toString().trim() === '',
    );

    if (hasEmptyField) {
      setAlertMessage('Please fill out all fields before submitting');
      setShowAlert(hasEmptyField);
      return;
    }

    const startTimeInMinutes = parseTime(testResults.timeStarted);
    const endTimeInMinutes = parseTime(testResults.timeEnded);
    const currentTimeInMinutes = parseTime(currentTime);

    const isStartTimeAfterEndTime =
      testResults.timeStarted > testResults.timeEnded;
    const isEndTimeAfterCurrentTime = endTimeInMinutes > currentTimeInMinutes;
    let isTimeThresholdReached = endTimeInMinutes - startTimeInMinutes <= 2;
    const isTimeEndValid = endTimeInMinutes - startTimeInMinutes > 20;

    if (isStartTimeAfterEndTime) {
      setAlertMessage("Please input a valid time for 'Time End'");
      setShowAlert(isStartTimeAfterEndTime);
      return;
    }

    if (isEndTimeAfterCurrentTime) {
      setAlertMessage("Please input a valid time for 'Time End'");
      setShowAlert(isEndTimeAfterCurrentTime);
      return;
    }

    if (
      isTimeThresholdReached &&
      testName !== 'BMI (Weight)' &&
      testName !== 'BMI (Height)'
    ) {
      setAlertMessage(
        'Test duration is too short. The test must last more than 2 minutes for accurate results.',
      );
      setShowAlert(isTimeThresholdReached);
      return;
    }

    if (isTimeEndValid) {
      setAlertMessage(
        'Test duration is too long. The test should not exceed 20 minutes. Please check your time entries.',
      );
      setShowAlert(isTimeEndValid);
      return;
    }

    setPhysicalFitnessData(prev => {
      const updatedFinishedTestIndex = Array.isArray(prev.finishedTestIndex)
        ? [...prev.finishedTestIndex]
        : [];

      updatedFinishedTestIndex[Number(index)] = Number(index);
      const updatedPhysicalFitnessData = {
        ...prev,
        [testDetails.key]: {
          title: testName,
          record: testResults.reps,
          timeStarted: testResults.timeStarted,
          timeEnd: testResults.timeEnded,
          classification: testResults.classification,
        },
        finishedTestIndex: updatedFinishedTestIndex,
      };

      setDataToStorage('physicalFitnessData', updatedPhysicalFitnessData);
      supabase
        .from('physical_fitness_test')
        .update({ [testType]: updatedPhysicalFitnessData })
        .eq('uuid', userId)
        .then(({ data, error }) => {
          if (error) {
            // Handle error silently
          }
        });
      return updatedPhysicalFitnessData;
    });
    if (physicalFitnessData.finishedTestIndex.length >= Number(index)) {
      scrollToTop();
      navigate(`/physical-fitness-test/test/${Number(index) + 1}`);
      setTimerTime(1200);
      setTestResults({
        reps: '',
        timeStarted: currentTime,
        timeEnded: '',
        classification: 'No data available',
      });
    }
  }, [
    userId,
    testResults,
    setPhysicalFitnessData,
    testDetails,
    testType,
    physicalFitnessData.finishedTestIndex.length,
    index,
    navigate,
    currentTime,
    timerTime,
    scrollToTop,
  ]);

  const handleNextExerciseTeacher = () => {
    setPhysicalFitnessData(prev => {
      const updatedFinishedTestIndex = Array.isArray(prev.finishedTestIndex)
        ? [...prev.finishedTestIndex]
        : [];

      updatedFinishedTestIndex[Number(index)] = Number(index);
      const updatedPhysicalFitnessData = {
        ...prev,
        [testDetails.key]: {
          title: testName,
          reps: testResults.reps,
          timeStarted: currentTime,
          timeEnded: '',
          classification: 'No data available',
        },
        finishedTestIndex: updatedFinishedTestIndex,
      };

      setDataToStorage('physicalFitnessData', updatedPhysicalFitnessData);
      supabase
        .from('physical_fitness_test')
        .update({ [testType]: updatedPhysicalFitnessData })
        .eq('uuid', userId)
        .then(({ data, error }) => {
          if (error) {
            // Handle error silently
          }
        });
      return updatedPhysicalFitnessData;
    });
    if (physicalFitnessData.finishedTestIndex.length >= Number(index)) {
      scrollToTop();
      navigate(`/physical-fitness-test/test/${Number(index) + 1}`);
      setTimerTime(1200);
      setTestResults({
        reps: '',
        timeStarted: currentTime,
        timeEnded: '',
        classification: 'No data available',
      });
    }
  };

  useEffect(() => {
    const handleKeyPress = e => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleSubmit]);

  return (
    <div id='test-container' className='min-w-[100%] h-full '>
      {showAlert && (
        <AlertMessage
          text={alertMessage}
          onCancel={() => setShowAlert(false)}
          onConfirm={() => setShowAlert(false)}
        ></AlertMessage>
      )}
      <div
        id='test-contents'
        className='w-[95%] mt-20 gap-5 mr-auto ml-auto lg:grid lg:grid-cols-[65%_35%] lg:w-[85%] lg:mt-0'
      >
        <div
          id='test-instructions'
          className='p-5 pb-10 grid grid-cols-[60%_40%] border-2 border-black row-span-2 relative font-content rounded-2xl lg:p-10'
        >
          <div
            id='name'
            className='flex w-full flex-col justify-center items-start'
          >
            <h1 id='test-name' className='text-3xl font-bold mb-3'>
              {testName}
            </h1>
            <hr className='w-[50%] border-1 border-black' />
          </div>
          {userType !== 'teacher' && (
            <div
              id='timer'
              className='absolute -top-20 flex pl-5 flex-row w-full justify-center gap-5 items-center lg:relative lg:top-0 lg:block lg:w-auto lg:p-0'
            >
              <p className='text-lg font-bold italic'>Timeout in:</p>
              <SimpleTimer
                time={timerTime}
                className='flex flex-row justify-start items-center space-x-5 lg:relative lg:right-0 lg:w-[50%] lg:mt-2'
                onEnd={() => setIsTimeout(true)}
                testName={testName}
              />
            </div>
          )}
          <iframe
            src={videoInstructions}
            className='col-span-2 mt-10 mb-5 w-full aspect-video border-1 border-black rounded-sm'
            allow='autoplay'
          ></iframe>
          <div id='instructions' className='col-span-2 text-sm font-medium'>
            <h2 className='text-xl font-bold'>Description:</h2>
            <InstructionsGroup text='' array={description} id='description' />
            <h2 className='text-xl font-bold mt-3'>Instructions:</h2>
            <InstructionsGroup
              text='Equipment'
              array={equipment}
              id='equipment'
            />
            <InstructionsGroup
              text='For the tester'
              array={instructionsForTester}
              id='for-tester'
            />
            <InstructionsGroup
              text='For the partner'
              array={instructionsForPartner}
              id='for-partner'
            />
            <InstructionsGroup
              text='Scoring'
              array={instructionsScoring}
              id='scoring'
            />
          </div>
          <hr className='absolute bottom-8 right-0 border-1 border-black w-[20%]' />
          <hr className='absolute bottom-5 left-0 border-1 border-black w-[50%]' />
        </div>
        <div
          id='results-interpretation-tips'
          className='flex flex-col space-y-5'
        >
          {/* right side container*/}
          <ResultSection
            testName={testName}
            handleResultChange={handleResultChange}
            handleSubmit={isTeacher ? handleNextExerciseTeacher : handleSubmit}
            handleBack={handleBackForTeacher}
            testResults={testResults}
            currentTime={currentTime}
            unit={unit}
            isTeacher={isTeacher}
            testNumber={Number(index)}
          />{' '}
          <TipsAndInterpretation
            testName={testName}
            testResults={testResults}
            tips={testDetails?.tips}
          />
        </div>
      </div>
    </div>
  );
}
