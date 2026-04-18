import PhysicalFitnessTest from '@/components/physical-fitness-test/PhysicalFitnessTest';
import PageHeading from '@/components/PageHeading';
import { data, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { usePhysicalFitnessData } from '@/hooks/usePhysicalFitnessData';
import getDataFromStorage from '@/utilities/getDataFromStorage';
import supabase from '@/client/supabase';
import { useUserId } from '@/hooks/useUserId';
import Loading from '@/components/Loading';

export function PhysicalFitnessTestPage () {
  const { testIndex } = useParams();
  const [isBadRequest, setIsBadRequest] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isTaken, setIsTaken] = useState(false);
  const [userType, setUserType] = useState('');
  const [testType, setTestType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teacherReady, setTeacherReady] = useState(false);
  const { physicalFitnessData, setPhysicalFitnessData } =
    usePhysicalFitnessData();
  const navigate = useNavigate();
  const userId = useUserId();

  useEffect(() => {
    if (!userId) {
      setTeacherReady(false);
      return;
    }
    const checkUserType = async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('user_type')
        .single()
        .eq('uuid', userId);

      if (error) {
        setUserType('student');
        return;
      }
      setUserType(data.user_type); //student or teacher
      setTeacherReady(true);
    };

    checkUserType();
  }, [userId]);

  useEffect(() => {
    const dataFromStorage = getDataFromStorage('physicalFitnessData');
    if (dataFromStorage && Object.keys(dataFromStorage).length > 0) {
      setPhysicalFitnessData(dataFromStorage);

      let finishedTestIndex = [];
      let currentTestIndex = 0;
      if (dataFromStorage) {
        finishedTestIndex = dataFromStorage.finishedTestIndex;
        currentTestIndex = Number(testIndex);
      }
      if (testIndex === 0) {
        setIsDataReady(true);
      }
      if (
        !finishedTestIndex.includes(currentTestIndex - 1) ||
        finishedTestIndex.length <= currentTestIndex
      ) {
        setIsBadRequest(true);
      }
      setIsDataReady(true);
    } else {
      setIsBadRequest(true);
    }
  }, [setPhysicalFitnessData, testIndex, physicalFitnessData.length, navigate]);

  useEffect(() => {
    const finishedTestIndex = physicalFitnessData.finishedTestIndex || [];
    if (finishedTestIndex.includes(finishedTestIndex.length - 1)) {
      localStorage.removeItem('physicalFitnessData');
      if (userType === 'teacher') {
        alert(
          'Physical Fitness Test completed. You are about to be redirected to your dashboard.',
        );
        navigate(`/dashboard`);
        return;
      }
      navigate(
        `/physical-fitness-test/summary/${
          testType === 'pre_physical_fitness_test' ? 'pre-test' : 'post-test'
        }`,
      );
    }
  }, [physicalFitnessData.finishedTestIndex, navigate]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(true);
      return;
    } // Wait until userId is defined
    const checkIfTestTaken = async () => {
      if (typeof userId !== 'string' || userId.trim() === '') {
        setIsBadRequest(true);
        return;
      }

      const { data: existing, error: fetchError } = await supabase
        .from('physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userId)
        .single();

      if (fetchError) {
        return;
      }
      const preTestFinishedTests =
        existing?.pre_physical_fitness_test?.finishedTestIndex || [];
      const postTestFinishedTests =
        existing?.post_physical_fitness_test?.finishedTestIndex || [];

      const max =
        preTestFinishedTests.length - 1 || postTestFinishedTests.length - 1;

      if (
        preTestFinishedTests.includes(max) &&
        postTestFinishedTests.includes(max)
      ) {
        setIsTaken(true);
      } else if (!preTestFinishedTests.includes(max)) {
        setTestType('pre_physical_fitness_test');
      } else if (!postTestFinishedTests.includes(max)) {
        setTestType('post_physical_fitness_test');
      }
      setIsLoading(false);
    };

    checkIfTestTaken();
  }, [userId]);

  const handleTimeoutConfirm = () => {
    if (testIndex === '0') {
      setIsTimeout(false);
      window.location.reload();
    } else {
      navigate('/physical-fitness-test/test/0');
    }
  };

  const handleTimeoutCancel = () => {
    navigate('/physical-fitness-test/parq');
  };

  if (isLoading || !teacherReady) {
    return <Loading />;
  }

  if (isDataReady && isBadRequest) {
    return <ErrorMessage text={'Error 400'} subText={'Bad Request'} />;
  }

  if (isBadRequest) {
    return <ErrorMessage text={'Error 400'} subText={'Bad Request'} />;
  }

  if (isTimeout) {
    return (
      <AlertMessage
        text={'Looks like the timer has ran out, Retry?'}
        onCancel={handleTimeoutCancel}
        onConfirm={handleTimeoutConfirm}
      />
    );
  }

  if (isTaken) {
    return (
      <ErrorMessage
        text={'You have already been taken the test'}
        subText='go to dashboard to view results'
      />
    );
  }

  return (
    <div id='physical-fitness-test-container' className=''>
      <PageHeading text='Physical Fitness Test' />
      {isDataReady && (
        <div
          id='physical-fitness-content'
          className='content-container w-full! mb-10'
        >
          <PhysicalFitnessTest
            physicalFitnessData={physicalFitnessData}
            index={testIndex}
            setIsTimeout={setIsTimeout}
            testType={testType}
            userType={userType}
          />
        </div>
      )}
    </div>
  );
}
