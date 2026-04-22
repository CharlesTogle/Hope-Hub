import PhysicalFitnessTest from '@/components/physical-fitness-test/PhysicalFitnessTest';
import PageHeading from '@/components/PageHeading';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { usePhysicalFitnessStore } from '@/store/physical-fitness-store';
import getDataFromStorage from '@/utilities/getDataFromStorage';
import supabase from '@/client/supabase';
import Loading from '@/components/Loading';
import { useQuery } from '@tanstack/react-query';
import { pftKeys, profileKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';

export function PhysicalFitnessTestPage() {
  const { testIndex } = useParams();
  const [isTimeout, setIsTimeout] = useState(false);
  const { sessionData: physicalFitnessData, setSessionData: setPhysicalFitnessData } = usePhysicalFitnessStore();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const navigate = useNavigate();

  const { data: userType = 'student', isLoading: typeLoading } = useQuery({
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

  const { data: pftStatus, isLoading: pftLoading } = useQuery({
    queryKey: pftKeys.session(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_fitness_test')
        .select('pre_physical_fitness_test, post_physical_fitness_test')
        .eq('uuid', userId)
        .single();
      if (error) return { isTaken: false, testType: 'pre_physical_fitness_test' };
      const preFI = data?.pre_physical_fitness_test?.finishedTestIndex ?? [];
      const postFI = data?.post_physical_fitness_test?.finishedTestIndex ?? [];
      const max = Math.max(preFI.length - 1, postFI.length - 1);
      if (preFI.includes(max) && postFI.includes(max)) return { isTaken: true, testType: '' };
      if (!preFI.includes(max)) return { isTaken: false, testType: 'pre_physical_fitness_test' };
      return { isTaken: false, testType: 'post_physical_fitness_test' };
    },
    enabled: !!userId,
  });

  // Validate data from storage
  const dataFromStorage = getDataFromStorage('physicalFitnessData');
  const hasStorageData = dataFromStorage && Object.keys(dataFromStorage).length > 0;
  const finishedTestIndex = hasStorageData ? dataFromStorage.finishedTestIndex : [];
  const currentTestIndex = Number(testIndex);
  const isBadRequest =
    !hasStorageData ||
    (testIndex !== '0' &&
      (!finishedTestIndex.includes(currentTestIndex - 1) ||
        finishedTestIndex.length <= currentTestIndex));

  // Sync storage into store if needed
  if (hasStorageData && !physicalFitnessData) {
    setPhysicalFitnessData(dataFromStorage);
  }

  // Check if PFT is fully done and redirect
  const pftFinishedIndex = physicalFitnessData?.finishedTestIndex ?? [];
  if (pftFinishedIndex.includes(pftFinishedIndex.length - 1) && pftFinishedIndex.length > 0) {
    localStorage.removeItem('physicalFitnessData');
    if (userType === 'teacher') {
      navigate('/dashboard');
    } else {
      const testType = pftStatus?.testType ?? 'pre_physical_fitness_test';
      navigate(`/physical-fitness-test/summary/${testType === 'pre_physical_fitness_test' ? 'pre-test' : 'post-test'}`);
    }
  }

  const handleTimeoutConfirm = () => {
    if (testIndex === '0') {
      setIsTimeout(false);
      window.location.reload();
    } else {
      navigate('/physical-fitness-test/test/0');
    }
  };
  const handleTimeoutCancel = () => navigate('/physical-fitness-test/parq');

  if (typeLoading || pftLoading || !userId) return <Loading />;
  if (isBadRequest) return <ErrorMessage text="Error 400" subText="Bad Request" />;
  if (isTimeout) return <AlertMessage text="Looks like the timer has ran out, Retry?" onCancel={handleTimeoutCancel} onConfirm={handleTimeoutConfirm} />;
  if (pftStatus?.isTaken) return <ErrorMessage text="You have already been taken the test" subText="go to dashboard to view results" />;

  return (
    <div id="physical-fitness-test-container">
      <PageHeading text="Physical Fitness Test" />
      {hasStorageData && (
        <div id="physical-fitness-content" className="content-container w-full! mb-10">
          <PhysicalFitnessTest
            physicalFitnessData={physicalFitnessData ?? dataFromStorage}
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
