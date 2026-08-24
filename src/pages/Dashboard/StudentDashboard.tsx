import Banner from '@/components/dashboard/Banner';
import Statistics from '@/components/dashboard/Statistics';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import JoinClass from '@/components/dashboard/JoinClass';
import ProfileSidebar from '@/components/dashboard/ProfileSidebar';
import { useProfilePicture } from '@/hooks/use-profile-picture';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { onProfileChange as onProfileChangeUtil } from '@/utilities/onProfileChange';
import { LogOut } from 'lucide-react';
import QuizScoreTable from '@/components/dashboard/QuizScoreTable';
import Loading from '@/components/Loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lectureKeys, pftKeys, classKeys, quizKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { joinStudentClass, leaveStudentClass } from '@/mutations/class-mutations';
import {
  fetchLectureProgressSummary,
  fetchQuizCount,
  fetchStudentClassCode,
  fetchStudentPftStatus,
  fetchStudentQuizProgressSummary,
  fetchStudentQuizRows,
} from '@/queries/dashboard-queries';
import type { DashboardQuizRow } from '@/types/student';
import { getUserFacingError } from '@/utilities/user-facing-errors';

export default function StudentDashboard() {
  const { profile, logout } = useAuthStore();
  const userID = profile?.uuid ?? null;
  const studentName = profile?.full_name ?? '';
  const tempClassCode = useUIStore((state) => state.studentDashboard.tempClassCode);
  const isJoiningClass = useUIStore((state) => state.studentDashboard.isJoiningClass);
  const confirmingLeave = useUIStore((state) => state.studentDashboard.confirmingLeave);
  const setTempClassCode = useUIStore((state) => state.setStudentTempClassCode);
  const setIsJoiningClass = useUIStore((state) => state.setStudentJoinClassOpen);
  const setConfirmingLeave = useUIStore((state) => state.setStudentConfirmingLeave);
  const resetStudentDashboard = useUIStore((state) => state.resetStudentDashboard);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profilePictureFile = useProfilePicture(userID);
  const memoizedFile = useMemo(
    () => profilePictureFile,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profilePictureFile?.size],
  );

  useEffect(() => resetStudentDashboard, [resetStudentDashboard]);

  // Lecture progress
  const { data: lectureProgressData, isLoading: lectureLoading } = useQuery({
    queryKey: lectureKeys.summary(userID ?? ''),
    queryFn: () => fetchLectureProgressSummary(userID ?? ''),
    enabled: !!userID,
  });

  // Quiz count
  const { data: quizCount = 0 } = useQuery<number>({
    queryKey: [...quizKeys.all, 'count'],
    queryFn: fetchQuizCount,
    enabled: !!userID,
  });

  // Quiz progress stats
  const { data: quizProgressStats, isLoading: quizStatsLoading } = useQuery({
    queryKey: [...quizKeys.all, 'progress-stats', userID ?? ''],
    queryFn: () => fetchStudentQuizProgressSummary(userID ?? '', quizCount),
    enabled: !!userID && quizCount > 0,
  });

  // Quiz detail data for table
  const { data: quizData = [], isLoading: quizDataLoading } = useQuery<DashboardQuizRow[]>({
    queryKey: [...quizKeys.all, 'detail-data', userID ?? ''],
    queryFn: () => fetchStudentQuizRows(userID ?? '', quizCount),
    enabled: !!userID && quizCount > 0,
  });

  // Class code
  const { data: classCode } = useQuery({
    queryKey: classKeys.studentCode(userID ?? ''),
    queryFn: () => fetchStudentClassCode(userID ?? ''),
    enabled: !!userID,
  });

  // PFT status
  const { data: pftData } = useQuery({
    queryKey: pftKeys.status(userID ?? ''),
    queryFn: () => fetchStudentPftStatus(userID ?? ''),
    enabled: !!userID,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinStudentClass(userID ?? '', code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.studentCode(userID ?? '') });
      setTempClassCode('');
      setIsJoiningClass(false);
    },
    onError: (error) => {
      toast.error(getUserFacingError(error, 'join-class'));
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveStudentClass(userID ?? ''),
    onSuccess: () => {
      setConfirmingLeave(false);
      queryClient.invalidateQueries({ queryKey: classKeys.studentCode(userID ?? '') });
    },
    onError: (error) => toast.error(getUserFacingError(error, 'leave-class')),
  });

  const handleLeaveClass = () => {
    if (!confirmingLeave) { setConfirmingLeave(true); return; }
    leaveMutation.mutate();
  };

  const handleJoinClass = () => joinMutation.mutate(tempClassCode);

  const handleProfileChange = async (file: File, fileName = 'profilePicture') => {
    const result = await onProfileChangeUtil(userID, file, fileName);
    if (result.success) toast.success('Your profile picture was updated.');
    else toast.error(result.error);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.remoteSignOutSucceeded) {
      toast.warning("You were signed out on this device, but we couldn't confirm it with the server.");
    }
    navigate('/auth/login', { replace: true });
  };

  const isLoading = lectureLoading || quizStatsLoading || quizDataLoading;

  if (!userID || isLoading) return <Loading />;

  return (
      <section className="student-dashboard parent-container">
      {isJoiningClass && (
        <JoinClass
          setTempClassCode={setTempClassCode}
          tempClassCode={tempClassCode}
          handleClose={() => setIsJoiningClass(false)}
          handleJoinClass={handleJoinClass}
        />
      )}
      <div className="lg:px-10 px-5 md:px-10 mt-5 mb-5 lg:mb-0 grid grid-cols-2 place-content-center w-full lg:w-fit lg:block">
        <div>
          <h1 className="font-heading text-primary-blue text-4xl lg:text-5xl">Dashboard</h1>
          <hr className="lg:w-90 border-1 border-primary-yellow mt-3" />
        </div>
        <div>
          <button
            className="lg:hidden ml-auto text-base font-bold font-content px-3 py-2 text-white bg-[#DB4E34] flex items-center gap-2 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-6 h-6" /> Logout
          </button>
        </div>
      </div>
      <DashboardContainer>
        <div id="content" className="w-full mb-20">
          <Banner
            name={studentName}
            classCode={classCode}
            onClassLeave={handleLeaveClass}
            onClassJoinOpen={() => setIsJoiningClass(true)}
            confirmingLeave={confirmingLeave}
          />
          <div id="statistics" className="grid grid-cols-2 gap-5">
            <div id="lectures">
              <Statistics
                progress={lectureProgressData ?? { completed: 0, incomplete: 0, pending: 0, total: 0 }}
                type="Lectures"
              />
            </div>
            <div id="quizzes">
              <Statistics
                progress={quizProgressStats ?? { completed: 0, incomplete: 0, pending: 0, total: 0 }}
                type="Quizzes"
              />
            </div>
          </div>
          <div id="quiz-scores" className="w-full text-center">
            <QuizScoreTable quizData={quizData} />
          </div>
          <div id="physical-fitness-records" className="w-full text-center grid grid-cols-2 gap-5">
            <button
              className="lg:p-7 lg:text-base text-xs p-5 bg-neutral-dark-blue text-white font-content rounded-md hover:brightness-90 cursor-pointer disabled:brightness-80 disabled:cursor-not-allowed"
              disabled={!pftData?.preFinished}
              onClick={() => pftData?.preFinished && navigate('/physical-fitness-test/summary/pre-test')}
            >
              VIEW PFT - PRE TEST RECORD
            </button>
            <button
              className="lg:p-7 lg:text-base text-xs p-5 bg-neutral-dark-blue text-white font-content rounded-md hover:brightness-90 cursor-pointer disabled:brightness-80 disabled:cursor-not-allowed"
              disabled={!pftData?.postFinished}
              onClick={() => pftData?.postFinished && navigate('/physical-fitness-test/summary/post-test')}
            >
              VIEW PFT - POST TEST RECORD
            </button>
          </div>
        </div>
        <div
          id="profile"
          className="hidden sticky w-full h-full max-h-[90vh]! top-0 bg-white lg:flex flex-col items-center justify-start"
        >
          <ProfileSidebar
            handleLogout={handleLogout}
            memoizedFile={memoizedFile}
            onProfileChange={handleProfileChange}
            userType="Student"
            name={studentName}
          />
        </div>
      </DashboardContainer>
    </section>
  );
}
