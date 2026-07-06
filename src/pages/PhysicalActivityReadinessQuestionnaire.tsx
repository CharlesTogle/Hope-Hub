import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeading from '@/components/PageHeading';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import { pftKeys } from '@/lib/query-keys';
import { getNextUnfinishedTestIndex } from '@/lib/pft-session';
import { savePftSession } from '@/mutations/pft-mutations';
import { fetchPftRecord } from '@/queries/pft-queries';
import { usePhysicalFitnessStore } from '@/store/physical-fitness-store';
import { useAuthStore } from '@/store/auth-store';
import { numberOfTests, PhysicalFitnessData } from '@/utilities/PhysicalFitnessData';
import type {
  PFTCategory,
  PFTGender,
  PFTSessionData,
} from '@/types/physical-fitness';

const QUESTIONS = [
  'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?',
  'Do you feel pain in your chest when you do physical activity?',
  'In the past month, have you had chest pain when you were not doing physical activity?',
  'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
  'Is your doctor currently prescribing drugs (for example, water pills) for your blood pressure or heart condition?',
  'Do you know of any other reason why you should not do physical activity?',
  'Hope Hub and its affiliated parties shall not be liable for any property damage or injuries that occur during this test. Do you agree?',
] as const;

type ParqAnswer = 'Yes' | 'No' | null;

interface ParqState {
  answers: ParqAnswer[];
  errorMessage: string | null;
}

type ParqAction =
  | { type: 'set-answer'; index: number; value: Exclude<ParqAnswer, null> }
  | { type: 'show-error'; message: string }
  | { type: 'clear-error' };

function createInitialParqState(): ParqState {
  return {
    answers: Array.from({ length: QUESTIONS.length }, () => null),
    errorMessage: null,
  };
}

function parqReducer(state: ParqState, action: ParqAction): ParqState {
  switch (action.type) {
    case 'set-answer': {
      const nextAnswers = [...state.answers];
      nextAnswers[action.index] = action.value;

      return {
        ...state,
        answers: nextAnswers,
      };
    }
    case 'show-error':
      return {
        ...state,
        errorMessage: action.message,
      };
    case 'clear-error':
      return {
        ...state,
        errorMessage: null,
      };
    default:
      return state;
  }
}

export default function PhysicalActivityReadinessQuestionnaire() {
  const physicalFitnessData = usePhysicalFitnessStore((state) => state.sessionData);
  const setPhysicalFitnessData = usePhysicalFitnessStore(
    (state) => state.setSessionData,
  );
  const updateField = usePhysicalFitnessStore((state) => state.updateField);
  const [state, dispatch] = useReducer(parqReducer, undefined, createInitialParqState);
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const userType = profile?.user_type ?? 'student';
  const { answers, errorMessage } = state;

  const areAllAnswersNo = useMemo(
    () =>
      answers.every((answer, index) =>
        index !== QUESTIONS.length - 1 ? answer === 'No' : answer === 'Yes',
      ),
    [answers],
  );
  const areAllAnswered = useMemo(
    () => answers.every((answer) => answer !== null),
    [answers],
  );
  const areAllUserDataFilled = !!(
    physicalFitnessData.gender && physicalFitnessData.category
  );

  const { data: pftRecord, isFetching, isLoading: pftLoading } = useQuery({
    queryKey: pftKeys.session(userId ?? ''),
    queryFn: () => fetchPftRecord(userId ?? ''),
    enabled: !!userId,
  });

  useEffect(() => {
    if (isFetching || userType !== 'teacher' || !userId) {
      return;
    }

    void navigateTeacher();
  }, [isFetching, userId, userType]);

  const navigateTeacher = async () => {
    if (!userId) {
      dispatch({ type: 'show-error', message: 'User not found.' });
      return;
    }

    const updatedData = {
      ...physicalFitnessData,
      isPARQFinished: true,
      finishedTestIndex: Array.from({ length: numberOfTests }, () => -1),
    } satisfies PFTSessionData;

    setPhysicalFitnessData(updatedData);

    try {
      await savePftSession(userId, 'pre_physical_fitness_test', updatedData);
    } catch {
      dispatch({
        type: 'show-error',
        message: 'Failed to save test data. Please try again.',
      });
      return;
    }

    navigate('/physical-fitness-test/test/0');
  };

  const handleAnswerChange = (
    index: number,
    value: Exclude<ParqAnswer, null>,
  ) => {
    dispatch({
      type: 'set-answer',
      index,
      value,
    });
  };

  const handleSubmit = async () => {
    dispatch({ type: 'clear-error' });

    if (userType === 'teacher') {
      await navigateTeacher();
      return;
    }

    if (!areAllAnswered) {
      dispatch({
        type: 'show-error',
        message: 'Make sure to answer all questions',
      });
      return;
    }

    if (!areAllAnswersNo) {
      dispatch({
        type: 'show-error',
        message:
          'You currently cannot take the Physical Fitness Test, try again a different time',
      });
      return;
    }

    if (!areAllUserDataFilled) {
      dispatch({
        type: 'show-error',
        message: 'Please complete Student/User Data',
      });
      return;
    }

    if (!userId) {
      dispatch({ type: 'show-error', message: 'User not found.' });
      return;
    }

    if (!pftRecord) {
      dispatch({
        type: 'show-error',
        message: 'Failed to load test record.',
      });
      return;
    }

    const preFinishedIndexes =
      pftRecord.pre_physical_fitness_test?.finishedTestIndex ?? [];
    const postFinishedIndexes =
      pftRecord.post_physical_fitness_test?.finishedTestIndex ?? [];

    let testType: 'pre_physical_fitness_test' | 'post_physical_fitness_test';
    let targetFinishedIndexes: number[];

    if (preFinishedIndexes.length === 0 || preFinishedIndexes.includes(-1)) {
      testType = 'pre_physical_fitness_test';
      targetFinishedIndexes = preFinishedIndexes;
    } else if (postFinishedIndexes.length === 0 || postFinishedIndexes.includes(-1)) {
      testType = 'post_physical_fitness_test';
      targetFinishedIndexes = postFinishedIndexes;
    } else {
      dispatch({
        type: 'show-error',
        message: 'You have already completed all tests.',
      });
      return;
    }

    const updatedData = {
      ...PhysicalFitnessData,
      gender: physicalFitnessData.gender,
      category: physicalFitnessData.category,
      isPARQFinished: true,
      ...(targetFinishedIndexes.length > 0 && {
        finishedTestIndex: targetFinishedIndexes,
      }),
    } satisfies PFTSessionData;

    setPhysicalFitnessData(updatedData);

    try {
      await savePftSession(userId, testType, updatedData);
    } catch {
      dispatch({
        type: 'show-error',
        message: 'Failed to save test data.',
      });
      return;
    }

    navigate(
      `/physical-fitness-test/test/${getNextUnfinishedTestIndex(
        targetFinishedIndexes,
      )}`,
    );
  };

  const handleInformationChange = (
    keyName: 'gender' | 'category',
    value: PFTGender | PFTCategory,
  ) => {
    updateField(keyName, value);
  };

  if (pftLoading || !userId || userType === 'teacher') return <Loading />;

  return (
    <div id="physical-fitness-test-parq" className="w-full min-h-screen max-h-fit">
      {errorMessage && (
        <AlertMessage
          text={errorMessage}
          onConfirm={() => dispatch({ type: 'clear-error' })}
          onCancel={() => dispatch({ type: 'clear-error' })}
        />
      )}
      <PageHeading text="Physical Fitness Test" className="" />
      <div id="physical-fitness-test-parq-container" className="content-container">
        <h2 id="heading" className="font-heading text-2xl text-center w-full lg:text-4xl lg:self-start! lg:text-left">
          Physical Activity Readiness Questionnaire (PAR-Q)
        </h2>
        <hr className="border-1 border-primary-yellow yellow w-[50%] self-start mt-2 lg:w-[20%]" />
        <div id="physical-fitness-test-parq-content" className="apply-drop-shadow w-full flex flex-col justify-center items-center mt-5 font-content text-lg space-y-5 lg:mt-10">
          <div id="instructions" className="w-[95%]">
            <p>Directions</p>
            <hr className="mb-7" />
            <ol className="list-decimal ml-7 text-sm lg:text-base">
              <li>Take the Physical Activity Readiness Questionnaire (PAR-Q).</li>
              <li>
                Be honest in all your answers.<br /><br />
                If you answered YES to one or more questions and have been inactive or concern about your health, consult a physician before taking a fitness test or substantially increasing your physical activity.<br /><br />
                If you answered NO to all the PAR-Q questions, you can be reasonably sure that you can exercise safely and have a low risk of having any medical complications from exercise.
              </li>
            </ol>
          </div>
          <div id="information" className="w-[95%] min-h-10 flex flex-col space-y-2 text-sm lg:text-base">
            <p className="text-base">PHYSICAL INFORMATION</p>
            <hr className="mb-7" />
            <div className="flex flex-row space-x-5">
              <p>Gender</p>
              {(['Male', 'Female'] as const).map((genderOption) => (
                <label key={genderOption}>
                  <input
                    type="radio"
                    name="gender"
                    value={genderOption}
                    checked={physicalFitnessData.gender === genderOption}
                    onChange={(event) => {
                      const newGender = event.target.value as PFTGender;
                      const currentCat = physicalFitnessData.category;
                      const catMatches = newGender === 'Male'
                        ? currentCat === 'elementaryBoys' || currentCat === 'secondaryBoys'
                        : currentCat === 'elementaryGirls' || currentCat === 'secondaryGirls';
                      handleInformationChange('gender', newGender);
                      if (!catMatches) {
                        handleInformationChange('category', '' as PFTCategory);
                      }
                    }}
                  />
                  {genderOption}
                </label>
              ))}
            </div>
            <label>
              <p>Category:</p>
              <select
                onChange={(event) =>
                  handleInformationChange(
                    'category',
                    event.target.value as PFTCategory,
                  )
                }
                value={physicalFitnessData.category}
                className="border-1 border-[#8B8989]! w-full font-content px-1 rounded-sm mt-0.5"
              >
                <option disabled value="">--Select one option--</option>
                {physicalFitnessData.gender === 'Male' && (
                  <>
                    <option value="elementaryBoys">Boy (Elementary 5-12 yrs old)</option>
                    <option value="secondaryBoys">Boy (High School 13-18 yrs old)</option>
                  </>
                )}
                {physicalFitnessData.gender === 'Female' && (
                  <>
                    <option value="elementaryGirls">Girl (Elementary 5-12 yrs old)</option>
                    <option value="secondaryGirls">Girl (High School 13-18 yrs old)</option>
                  </>
                )}
              </select>
            </label>
          </div>
          <div id="questions" className="w-[95%] min-h-10 text-sm lg:text-base">
            <p className="text-base">PHYSICAL ACTIVITY READINESS QUESTIONNAIRE (PAR-Q)</p>
            <hr className="mb-7" />
            <ol className="list-decimal ml-7">
              {QUESTIONS.map((question, index) => (
                <li key={question} className="mb-4">
                  {question}
                  <div className="flex flex-col mt-2">
                    {(['Yes', 'No'] as const).map((option) => (
                      <label key={option} className="mb-2 lg:mb-0">
                        <input
                          type="radio"
                          name={`radioQuestion${index}`}
                          value={option}
                          checked={answers[index] === option}
                          className="mr-2"
                          onChange={(event) =>
                            handleAnswerChange(
                              index,
                              event.target.value as Exclude<ParqAnswer, null>,
                            )
                          }
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div id="button-container" className="w-[95%] drop-shadow-none! border-0! flex justify-end p-0! mb-5">
            <button className="px-10 py-3 bg-secondary-dark-blue text-white hover:brightness-70 cursor-pointer" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
