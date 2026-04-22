import PageHeading from '@/components/PageHeading';
import { usePhysicalFitnessStore } from '@/store/physical-fitness-store';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import setDataToStorage from '@/utilities/setDataToStorage';
import supabase from '@/client/supabase';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import { numberOfTests } from '@/utilities/PhysicalFitnessData';
import { useQuery } from '@tanstack/react-query';
import { profileKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';

const QUESTIONS = [
  'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?',
  'Do you feel pain in your chest when you do physical activity?',
  'In the past month, have you had chest pain when you were not doing physical activity?',
  'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
  'Is your doctor currently prescribing drugs (for example, water pills) for your blood pressure or heart condition?',
  'Do you know of any other reason why you should not do physical activity?',
  'Hope Hub and its affiliated parties shall not be liable for any property damage or injuries that occur during this test. Do you agree?',
];

export default function PhysicalActivityReadinessQuestionnaire() {
  const { sessionData: physicalFitnessData, setSessionData: setPhysicalFitnessData } = usePhysicalFitnessStore();
  const [areAllAnswersNo, setAreAllAnswersNo] = useState(false);
  const [areAllAnswered, setAreAllAnswered] = useState(false);
  const [areAllUserDataFilled, setAreAllUserDataFilled] = useState(false);
  const [answers, setAnswers] = useState(Array(7).fill(null));
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;

  const { data: userType = 'student', isLoading } = useQuery({
    queryKey: [...profileKeys.detail(userId ?? ''), 'user-type'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profile')
        .select('user_type')
        .eq('uuid', userId)
        .single();
      return data?.user_type ?? 'student';
    },
    enabled: !!userId,
  });

  const navigateTeacher = async () => {
    const updatedData = {
      ...physicalFitnessData,
      isPARQFinished: true,
      finishedTestIndex: Array.from({ length: numberOfTests }, () => -1),
    };
    setPhysicalFitnessData(updatedData);
    setDataToStorage('physicalFitnessData', updatedData);
    const { error } = await supabase
      .from('physical_fitness_test')
      .update({ pre_physical_fitness_test: updatedData })
      .eq('uuid', userId);
    if (error) {
      setErrorMessage('Failed to save test data. Please try again.');
      setIsError(true);
      return;
    }
    navigate('/physical-fitness-test/test/0');
  };

  const handleAnswerChange = (index, value) => {
    const current = [...answers];
    current[index] = value;
    const allNo = current.every((a, i) => (i !== QUESTIONS.length - 1 ? a === 'No' : a === 'Yes'));
    const allAnswered = current.every((a) => a !== null);
    setAnswers(current);
    setAreAllAnswersNo(allNo);
    setAreAllAnswered(allAnswered);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (userType === 'teacher') { await navigateTeacher(); return; }
    if (areAllAnswered && areAllAnswersNo && areAllUserDataFilled) {
      if (!userId) { setErrorMessage('User not found.'); setIsError(true); return; }
      const { data: existing, error: fetchError } = await supabase
        .from('physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userId)
        .single();
      if (fetchError) { setErrorMessage('Failed to load test record.'); setIsError(true); return; }
      const preFI = existing?.pre_physical_fitness_test?.finishedTestIndex ?? [];
      const postFI = existing?.post_physical_fitness_test?.finishedTestIndex ?? [];
      const max = Math.max(preFI.length, postFI.length);
      let testType = '', testIndex = 0, newTest = true, testIndeces: number[] = [];
      if (!preFI.includes(max - 1)) {
        testType = 'pre_physical_fitness_test';
        testIndex = preFI.findIndex((i) => i === -1);
        newTest = testIndex === -1;
        testIndeces = preFI;
      } else if (!postFI.includes(max - 1)) {
        testType = 'post_physical_fitness_test';
        testIndex = postFI.findIndex((i) => i === -1);
        newTest = testIndex === -1;
        testIndeces = postFI;
      } else {
        setErrorMessage('You have already completed all tests.'); setIsError(true); return;
      }
      const updatedData = { ...physicalFitnessData, isPARQFinished: true, ...(!newTest && { finishedTestIndex: testIndeces }) };
      setPhysicalFitnessData(updatedData);
      setDataToStorage('physicalFitnessData', updatedData);
      const { error: updateError } = await supabase
        .from('physical_fitness_test')
        .update({ [testType]: updatedData })
        .eq('uuid', userId);
      if (updateError) { setErrorMessage('Failed to save test data.'); setIsError(true); return; }
      navigate(`/physical-fitness-test/test/${testIndex === -1 ? 0 : testIndex}`);
    } else {
      if (!areAllAnswered) setErrorMessage('Make sure to answer all questions');
      else if (!areAllAnswersNo) setErrorMessage('You currently cannot take the Physical Fitness Test, try again a different time');
      else if (!areAllUserDataFilled) setErrorMessage('Please complete Student/User Data');
      setIsError(true);
    }
  };

  const handleInformationChange = (keyName: string, value: string) => {
    const updatedData = { ...physicalFitnessData, [keyName]: value };
    setPhysicalFitnessData(updatedData);
    setAreAllUserDataFilled(['gender', 'category'].every((k) => !!(updatedData as Record<string, unknown>)[k]));
  };

  if (isLoading || !userId) return <Loading />;

  return (
    <div id="physical-fitness-test-parq" className="w-full min-h-screen max-h-fit">
      {isError && (
        <AlertMessage text={errorMessage} onConfirm={() => setIsError(false)} onCancel={() => setIsError(false)} />
      )}
      <PageHeading text="Physical Fitness Test" />
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
              {['Male', 'Female'].map((g) => (
                <label key={g}>
                  <input type="radio" name="gender" value={g} onChange={(e) => handleInformationChange('gender', e.target.value)} />
                  {g}
                </label>
              ))}
            </div>
            <label>
              <p>Category:</p>
              <select onChange={(e) => handleInformationChange('category', e.target.value)} defaultValue={physicalFitnessData?.category ?? ''} className="border-1 border-[#8B8989]! w-full font-content px-1 rounded-sm mt-0.5">
                <option disabled value="">--Select one option--</option>
                <option value="elementaryBoys">Boy (Elementary 5-12 yrs old)</option>
                <option value="elementaryGirls">Girl (Elementary 5-12 yrs old)</option>
                <option value="secondaryBoys">Boy (High School 13-18 yrs old)</option>
                <option value="secondaryGirls">Girl (High School 13-18 yrs old)</option>
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
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="mb-2 lg:mb-0">
                        <input type="radio" name={`radioQuestion${index}`} value={opt} className="mr-2" onChange={(e) => handleAnswerChange(index, e.target.value)} />
                        {opt}
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
