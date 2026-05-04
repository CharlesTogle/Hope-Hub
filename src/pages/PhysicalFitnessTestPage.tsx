import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PhysicalFitnessTest from '@/components/physical-fitness-test/PhysicalFitnessTest';
import PageHeading from '@/components/PageHeading';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import Loading from '@/components/Loading';
import supabase from '@/client/supabase';
import { pftKeys, profileKeys } from '@/lib/query-keys';
import { usePhysicalFitnessStore } from '@/store/physical-fitness-store';
import { useAuthStore } from '@/store/auth-store';
import getDataFromStorage from '@/utilities/getDataFromStorage';
import type { UserType } from '@/types/auth';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';

interface PFTStatus {
  isTaken: boolean;
  testType: PFTColumnName;
}

export function PhysicalFitnessTestPage() {
  const { testIndex = '0' } = useParams<{ testIndex: string }>();
  const [isTimeout, setIsTimeout] = useState(false);
  const navigate = useNavigate();

  const {
    sessionData: physicalFitnessData,
    setSessionData: setPhysicalFitnessData,
  } = usePhysicalFitnessStore();
  const profile = useAuthStore((state) => state.profile);
  const userId = profile?.uuid ?? null;
  const dataFromStorage = getDataFromStorage<PFTSessionData>('physicalFitnessData');
  const currentSessionData = physicalFitnessData ?? dataFromStorage;
  const hasStorageData = !!currentSessionData;
  const currentTestIndex = Number(testIndex);
  const finishedTestIndex = currentSessionData?.finishedTestIndex ?? [];
  const isBadRequest =
    !currentSessionData ||
    (testIndex !== '0' &&
      (!finishedTestIndex.includes(currentTestIndex - 1) ||
        finishedTestIndex.length <= currentTestIndex));

  const { data: userType = 'student', isLoading: typeLoading } = useQuery<UserType>({
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

  const { data: pftStatus, isLoading: pftLoading } = useQuery<PFTStatus>({
    queryKey: pftKeys.session(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userId)
        .single();

      if (error) {
        return { isTaken: false, testType: 'pre_physical_fitness_test' };
      }

      const preFinishedIndex = data?.pre_physical_fitness_test?.finishedTestIndex ?? [];
      const postFinishedIndex = data?.post_physical_fitness_test?.finishedTestIndex ?? [];
      const maxFinishedIndex = Math.max(
        preFinishedIndex.length - 1,
        postFinishedIndex.length - 1,
      );

      if (
        preFinishedIndex.includes(maxFinishedIndex) &&
        postFinishedIndex.includes(maxFinishedIndex)
      ) {
        return { isTaken: true, testType: 'pre_physical_fitness_test' };
      }

      if (!preFinishedIndex.includes(maxFinishedIndex)) {
        return { isTaken: false, testType: 'pre_physical_fitness_test' };
      }

      return { isTaken: false, testType: 'post_physical_fitness_test' };
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (dataFromStorage && !physicalFitnessData) {
      setPhysicalFitnessData(dataFromStorage);
    }
  }, [dataFromStorage, physicalFitnessData, setPhysicalFitnessData]);

  useEffect(() => {
    if (!currentSessionData) {
      return;
    }

    const completedIndexes = currentSessionData.finishedTestIndex;
    const isFinished =
      completedIndexes.length > 0 &&
      completedIndexes.includes(completedIndexes.length - 1);

    if (!isFinished) {
      return;
    }

    localStorage.removeItem('physicalFitnessData');

    if (userType === 'teacher') {
      navigate('/dashboard');
      return;
    }

    const nextTestType = pftStatus?.testType ?? 'pre_physical_fitness_test';
    navigate(
      `/physical-fitness-test/summary/${
        nextTestType === 'pre_physical_fitness_test' ? 'pre-test' : 'post-test'
      }`,
    );
  }, [currentSessionData, navigate, pftStatus?.testType, userType]);

  const handleTimeoutConfirm = () => {
    if (testIndex === '0') {
      setIsTimeout(false);
      window.location.reload();
      return;
    }

    navigate('/physical-fitness-test/test/0');
  };

  const handleTimeoutCancel = () => {
    navigate('/physical-fitness-test/parq');
  };

  if (typeLoading || pftLoading || !userId) {
    return <Loading />;
  }

  if (isBadRequest) {
    return <ErrorMessage text="Error 400" subText="Bad Request" />;
  }

  if (isTimeout) {
    return (
      <AlertMessage
        text="Looks like the timer has ran out, Retry?"
        onCancel={handleTimeoutCancel}
        onConfirm={handleTimeoutConfirm}
      />
    );
  }

  if (pftStatus?.isTaken) {
    return (
      <ErrorMessage
        text="You have already been taken the test"
        subText="go to dashboard to view results"
      />
    );
  }

  if (!currentSessionData) {
    return <Loading />;
  }

  return (
    <div id="physical-fitness-test-container">
      <PageHeading text="Physical Fitness Test" />
      {hasStorageData && (
        <div id="physical-fitness-content" className="content-container w-full! mb-10">
          <PhysicalFitnessTest
            physicalFitnessData={currentSessionData}
            index={testIndex}
            setIsTimeout={setIsTimeout}
            testType={pftStatus?.testType ?? 'pre_physical_fitness_test'}
            userType={userType}
          />
        </div>
      )}
    </div>
  );
}
