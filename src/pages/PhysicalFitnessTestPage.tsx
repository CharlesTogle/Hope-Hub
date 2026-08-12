import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PhysicalFitnessTest from '@/components/physical-fitness-test/PhysicalFitnessTest';
import PageHeading from '@/components/PageHeading';
import { AlertMessage } from '@/components/utilities/AlertMessage';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import Loading from '@/components/Loading';
import { pftKeys } from '@/lib/query-keys';
import {
  derivePftStatus,
  isFinishedTestSession,
  resetPftProgress,
} from '@/lib/pft-session';
import { fetchPftRecord } from '@/queries/pft-queries';
import { usePhysicalFitnessStore } from '@/store/physical-fitness-store';
import { useAuthStore } from '@/store/auth-store';

export function PhysicalFitnessTestPage() {
  const { testIndex = '0' } = useParams<{ testIndex: string }>();
  const [isTimeout, setIsTimeout] = useState(false);
  const navigate = useNavigate();
  const currentSessionData = usePhysicalFitnessStore((state) => state.sessionData);
  const setSessionData = usePhysicalFitnessStore((state) => state.setSessionData);
  const clearSessionData = usePhysicalFitnessStore(
    (state) => state.clearSessionData,
  );
  const profile = useAuthStore((state) => state.profile);
  const userId = profile?.uuid ?? null;
  const userType = profile?.user_type ?? 'student';
  const isTeacher = userType === 'teacher';
  const currentTestIndex = Number(testIndex);
  const finishedTestIndex = currentSessionData.finishedTestIndex;
  const isBadRequest =
    !isTeacher &&
    testIndex !== '0' &&
    (!finishedTestIndex.includes(currentTestIndex - 1) ||
      finishedTestIndex.length <= currentTestIndex);

  const { data: pftRecord, isFetching: pftFetching, isLoading: pftLoading } = useQuery({
    queryKey: pftKeys.session(userId ?? ''),
    queryFn: () => fetchPftRecord(userId ?? ''),
    enabled: !!userId,
  });

  const pftStatus = useMemo(() => pftRecord ? derivePftStatus(pftRecord) : null, [pftRecord]);

  useEffect(() => {
    if (pftFetching || !userId || isTeacher) {
      return;
    }

    if (!currentSessionData.isPARQFinished) {
      navigate('/physical-fitness-test/parq');
    }
  }, [pftFetching, userId, isTeacher, navigate]);

  useEffect(() => {
    if (!isFinishedTestSession(currentSessionData)) {
      return;
    }

    if (isTeacher) {
      clearSessionData();
      navigate('/dashboard');
      return;
    }

    const nextTestType = pftStatus?.testType ?? 'pre_physical_fitness_test';
    navigate(
      `/physical-fitness-test/summary/${
        nextTestType === 'pre_physical_fitness_test' ? 'pre-test' : 'post-test'
      }`,
    );
  }, [clearSessionData, currentSessionData, isTeacher, navigate, pftStatus?.testType]);

  const handleTimeoutConfirm = () => {
    setIsTimeout(false);
    setSessionData(resetPftProgress(currentSessionData));
    navigate('/physical-fitness-test/test/0');
  };

  const handleTimeoutCancel = () => {
    navigate('/physical-fitness-test/parq');
  };

  if (pftLoading || !userId) {
    return <Loading />;
  }

  if (isBadRequest) {
    return (
      <ErrorMessage
        title='This test step is not available'
        description='Complete the previous step before continuing.'
        onBack={() => navigate('/physical-fitness-test/parq')}
      />
    );
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
        title='You have already completed this test'
        description='View your results from the dashboard.'
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div id="physical-fitness-test-container">
      <PageHeading text="Physical Fitness Test" />
      <div id="physical-fitness-content" className="content-container w-full! mb-10">
        <PhysicalFitnessTest
          index={testIndex}
          setIsTimeout={setIsTimeout}
          testType={pftStatus?.testType ?? 'pre_physical_fitness_test'}
          userType={userType}
        />
      </div>
    </div>
  );
}
